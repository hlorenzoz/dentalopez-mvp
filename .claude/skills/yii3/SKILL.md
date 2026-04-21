---
name: yii3
description: Yii 3 PHP framework conventions — project layout, DI container, config plugin, middleware, routing, actions, views, events, aliases, migrations, authentication. Trigger when the user is working on a Yii 3 project (composer requires `yiisoft/*` packages, `./yii` console script, `config/` directory with `common|web|console|packages`), or asks about Yii3 features.
---

# Yii 3 Framework

Yii 3 is a package-based PHP ≥8.2 framework. It is composed of ~100+ independent `yiisoft/*` packages glued together by a PSR-7/PSR-15/PSR-11 core plus the `yiisoft/config` plugin. Unlike Yii 2, there is **no monolithic base class**: the application is whatever you assemble from packages and DI config. Prefer composition and interface-typed constructor injection over inheritance.

## When this applies

- `composer.json` depends on `yiisoft/app`, `yiisoft/yii-runner-*`, `yiisoft/di`, `yiisoft/router`, or similar `yiisoft/*` packages.
- The project has a `./yii` console entry, `public/index.php` using an application runner, and a `config/` directory with `common/`, `web/`, `console/`, `packages/`, `params.php`, `routes.php`, `providers*.php`, `events*.php`.
- PHP files use final readonly classes, constructor DI, and PSR-7 request/response types.

If the project instead has `Yii::$app`, `yii\base\*` inheritance, `gii` at `yii/gii`, `config/main.php` with `components`, it is **Yii 2** — do not apply these rules.

## Core rules

1. **Always program against interfaces** — `CacheInterface`, `LoggerInterface`, `EventDispatcherInterface`, `ResponseFactoryInterface`, `UrlGeneratorInterface`, `IdentityRepositoryInterface`, etc. Concrete classes go in DI config, not in `use` statements of business code.
2. **Prefer `final readonly class` with constructor injection**. No property injection except in DTOs. Dependencies are private. Never type-hint or inject `ContainerInterface` into business code — that hides dependencies.
3. **No statics, no service locators, no `Yii::$app`**. Everything flows through the DI container's autowiring.
4. **Actions and controllers are autowired twice**: the constructor receives shared dependencies; each action method also receives per-request dependencies (logger, request, route arguments).
5. **Configuration is data, not code**. Services are configured in `config/common|web|console/*.php`. Don't call `new` on framework services in business code.
6. **Use aliases (`@root`, `@runtime`, `@views`, …) in config**, not hardcoded paths. Resolve them with `Yiisoft\Aliases\Aliases` if you need the string at runtime.
7. **Middleware implements `Psr\Http\Server\MiddlewareInterface`**. HTTP messages are PSR-7 (`ServerRequestInterface`, `ResponseInterface`). Never mutate request/response objects; they are immutable — use `with*()` methods.
8. **Events are plain classes**, not strings. Dispatch via `EventDispatcherInterface::dispatch($event)`. Hierarchies (interface-based) replace wildcard matching.
9. **Params go in `config/params.php`**, not `getenv()` sprinkled through code. Other config files receive `$params` automatically. Env goes through `.env` → `Environment.php`.

## Project structure (from `yiisoft/app`)

```
config/
  common/       shared DI config
  web/          web-only DI config
  console/      console-only DI config
  environments/ dev/test/prod overrides
  packages/     vendored default configs (managed by yiisoft/config)
  params.php    all tunable values — $params in every config file
  routes.php    Yiisoft\Router\Route definitions
  events.php|events-web.php|events-console.php
  providers.php|providers-web.php|providers-console.php
public/
  index.php     entry script — uses an application runner
src/
  Console/      console commands
  Shared/       shared between web + console
  Web/          web actions, handlers, layouts
runtime/        writable runtime dir (@runtime)
resources/      views, translation messages, asset sources (@resources, @views)
yii             console entry
Makefile
```

Run: `composer create-project yiisoft/app your_project` → `./yii serve --port=80`. With Docker: `make up`.

## Request lifecycle

`public/index.php` → application runner builds DI container from merged config → request factory (PSR-17) creates `ServerRequestInterface` → `Yiisoft\Yii\Http\Application` dispatches middleware stack → one of those is `Yiisoft\Router\Middleware\Router` which matches a route and invokes the action → response bubbles back → `SapiEmitter` writes it out. Three lifecycle events: `ApplicationStartup`, `AfterEmit`, `ApplicationShutdown`.

## Reference sections

Load the relevant reference file when working on that topic:

- [di-and-config.md](references/di-and-config.md) — DI container definitions, service providers, config plugin merge rules, `$params`, naming conventions.
- [middleware-and-routing.md](references/middleware-and-routing.md) — writing middleware, registering in `application.php`, `Route::` / `Group::`, named parameters, URL generation.
- [actions-and-views.md](references/actions-and-views.md) — action classes, controllers, autowiring, `WebViewRenderer`, layouts, view injections.
- [events.md](references/events.md) — event classes, attaching handlers, hierarchies, `StoppableEventInterface`, configuration via `events*.php`.
- [aliases.md](references/aliases.md) — predefined aliases, resolving, defining in `params.php`.
- [security-and-auth.md](references/security-and-auth.md) — `CurrentUser`, `IdentityInterface`, `IdentityRepositoryInterface`, cryptography, passwords, best practices.
- [databases-and-migrations.md](references/databases-and-migrations.md) — DB connection, Active Record (external docs), `yiisoft/db-migration` workflow.
- [console-and-runtime.md](references/console-and-runtime.md) — console commands, RoadRunner / FrankenPHP / Swoole event-loop usage, performance tuning.

## Common tasks

### Add a controller action

1. Create `src/Web/<Feature>/Action.php` (single-responsibility) or `<Feature>Controller.php` with `actionX` methods.
2. Type-hint dependencies in constructor (shared) and method (per-request).
3. Return `ResponseInterface`. Use `WebViewRenderer` for HTML, `ResponseFactoryInterface` for raw.
4. Register route in `config/routes.php`:
   ```php
   Route::get('/path')->action([Controller::class, 'actionX'])->name('feature/x')
   ```

### Register a service

In `config/common/<topic>.php` (or `web/` / `console/`):
```php
return [
    MyServiceInterface::class => [
        'class' => MyService::class,
        '__construct()' => ['amount' => $params['foo']['amount']],
        'setDiscount()' => [10],
    ],
];
```
Simple cases: `EngineInterface::class => EngineMarkOne::class`. Closures: `static fn (ContainerInterface $c) => new Foo(...)`. For complex wiring extract a `ServiceProvider` and list it in `providers.php`.

### Add middleware globally

Edit `config/web/application.php` and include it in the `MiddlewareDispatcher::withMiddlewares([...])` list (usually after `ErrorCatcher`, before `Router`). For a single route, use `->middleware(Foo::class)` on the route. Middleware must `implements Psr\Http\Server\MiddlewareInterface`.

### Raise an event

1. Define `final readonly class UserSignedUp { public function __construct(public User $user) {} }`.
2. Inject `EventDispatcherInterface` and call `$dispatcher->dispatch($event)`.
3. Register handlers in `config/events.php`: `UserSignedUp::class => [static fn (UserSignedUp $e) => ..., [Service::class, 'handle']]`.

### Create a migration

1. `composer require yiisoft/db-migration` (once).
2. In `config/common/params.php` add `'yiisoft/db-migration' => ['newMigrationNamespace' => 'App\\Migration', 'sourceNamespaces' => ['App\\Migration']]`.
3. `./yii migrate:create <name>` → implement `up()` / `down()` or `safeUp()` / `safeDown()` in `src/Migration/`.
4. Apply: `./yii migrate:up`. Migrations must be independent of app code — no imports from `src/`.

## Anti-patterns to reject

- `class Foo extends \yii\base\Component` → that's Yii 2. Use composition.
- `Yii::$app->get('foo')` or `\Yii::` of any kind → no global.
- `new Cache()` inside business logic → use `CacheInterface` via DI.
- Injecting `ContainerInterface` into a controller → hides dependencies; type-hint the actual need instead.
- Mutating `$request` in place → PSR-7 messages are immutable; use `$request = $request->withAttribute(...)`.
- Putting constants or `getenv()` in controllers → put values in `params.php`, reference them in config.
- Adding wildcard event names / string event IDs → events are classes; use interface hierarchies.
- Route handlers returning strings → always return `ResponseInterface`.

## External references

- Official docs: https://yiisoft.github.io/docs/ and https://yii3.yiiframework.com/
- Project template: https://github.com/yiisoft/app
- Package index: https://github.com/yiisoft (each package has its own README and `docs/`)
- DB: https://github.com/yiisoft/db • AR: https://github.com/yiisoft/active-record • Validator: https://github.com/yiisoft/validator

For any package not covered in these references, read the package's README on GitHub — each `yiisoft/*` package is self-documenting.
