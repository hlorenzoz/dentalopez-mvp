# DI container and configuration

Packages: `yiisoft/di`, `yiisoft/injector`, `yiisoft/config`, `yiisoft/factory`.

## Definition forms in `config/common|web|console/*.php`

Every file returns `array<string, mixed>` where keys are interfaces/class names/string IDs and values are definitions.

### 1. Class name shorthand (auto-wired)
```php
return [
    EngineInterface::class => EngineMarkOne::class,
];
```
Use when no custom args — all constructor deps resolved from container.

### 2. Full array definition
```php
return [
    MyServiceInterface::class => [
        'class' => MyService::class,
        '__construct()' => ['amount' => 42],     // named or positional
        'setDiscount()' => [10],                 // method call after construction
        '$publicProperty' => 'value',            // public property set
    ],
];
```

### 3. Closure
```php
MyServiceInterface::class => static function (ContainerInterface $c) {
    return new MyService($c->get('db'));
},
```
Closure parameters after the first are auto-wired from container:
```php
MyServiceInterface::class => static fn (ConnectionInterface $db) => new MyService($db),
```

### 4. Static factory method
```php
MyServiceInterface::class => [MyFactory::class, 'create'],
```

### 5. Pre-built instance
```php
MyServiceInterface::class => new MyService(),
```

## Service providers

For wiring that's too complex for arrays, extend `Yiisoft\Di\Support\ServiceProvider`:

```php
use Psr\Container\ContainerInterface;
use Yiisoft\Di\Container;
use Yiisoft\Di\Support\ServiceProvider;

final readonly class CacheProvider extends ServiceProvider
{
    public function __construct(private string $cachePath = '@runtime/cache') {}

    public function register(Container $container): void
    {
        $container->set(CacheInterface::class, static function (ContainerInterface $c) {
            return new FileCache($c->get(Aliases::class)->get($this->cachePath));
        });
    }
}
```

Register in `config/providers.php` / `providers-web.php` / `providers-console.php`:
```php
return [
    'yiisoft/cache/cache' => [
        'class' => CacheProvider::class,
        '__construct()' => [$params['yiisoft/cache-file']['file-cache']['path']],
    ],
];
```
Keys follow `vendor/package/provider-name` convention. Drop the vendor prefix for app-local providers.

## References (lazy refs inside config)

- `Yiisoft\Definitions\Reference::to(Class::class)` — deferred lookup in the container; use where an array definition expects an instance.
- `Yiisoft\Definitions\DynamicReference::to(static fn (Injector $i) => ...)` — factory-style deferred resolution.

Example (from `application.php`):
```php
Yiisoft\Yii\Http\Application::class => [
    '__construct()' => [
        'dispatcher' => DynamicReference::to(static fn (Injector $injector) =>
            $injector->make(MiddlewareDispatcher::class)->withMiddlewares([
                ErrorCatcher::class, SessionMiddleware::class, CsrfMiddleware::class, Router::class,
            ])
        ),
        'fallbackHandler' => Reference::to(NotFoundHandler::class),
    ],
],
```

## The config plugin (`yiisoft/config`)

`composer.json` of `yiisoft/app` declares:
```json
"config-plugin-options": { "output-directory": "config/packages" },
"config-plugin": {
  "common":  "config/common/*.php",
  "params":  ["config/params.php", "?config/params-local.php"],
  "web":     ["$common", "config/web/*.php"],
  "console": ["$common", "config/console/*.php"],
  "events":  "config/events.php",
  "events-web":     ["$events", "config/events-web.php"],
  "events-console": ["$events", "config/events-console.php"],
  "providers":         "config/providers.php",
  "providers-web":     ["$providers", "config/providers-web.php"],
  "providers-console": ["$providers", "config/providers-console.php"],
  "routes":  "config/routes.php"
}
```

Rules:
- String = take this file/glob as-is and merge with same-named configs from dependencies that have `config-plugin`.
- Array = merge files in order.
- `?` prefix = optional file, skipped if missing.
- `$name` = reference another named config.
- `params` is special — automatically available as `$params` in every other config file.
- Each config key must have **a single source of truth**. One config cannot override another's value; duplicates are errors.

On `composer install|update`, the plugin copies package defaults into `config/packages/<vendor>/<package>/` and writes `config/packages/merge_plan.php` (used at runtime). Once copied, **you own those files** — edit freely. `dist.lock` tracks upstream diffs.

## Params (`config/params.php`)

```php
return [
    'app' => [
        'charset' => 'UTF-8',
        'locale' => 'en',
        'name' => 'My Project',
    ],
    'yiisoft/aliases' => [
        'aliases' => [
            '@root' => dirname(__DIR__),
            '@runtime' => '@root/runtime',
            // ...
        ],
    ],
    'yiisoft/yii-console' => [
        'commands' => ['hello' => Hello::class],
    ],
];
```

Convention:
1. Group by package name: `'yiisoft/cache-file' => [...]`.
2. App-local params skip vendor prefix: `'app' => [...]`.
3. Multi-service packages group per service.
4. Use `enabled` for toggles: `'yiisoft/yii-debug' => ['enabled' => true]`.

**Don't read params directly in application code.** Read them in config files and pass the result to services.

## Key naming convention for string service IDs

- Package-provided: `yiisoft/cache-file/custom-definition`
- App-local: `custom-definition` (no vendor prefix)

## Autowiring (`yiisoft/injector`)

The container auto-resolves constructor and invokable method parameters by type. That's how action handlers get their request, response factory, logger, etc. without explicit wiring. Don't inject `ContainerInterface` — type-hint what you actually need.

Factories (non-shared instances) come from `yiisoft/factory`, not the DI container (which only returns shared instances).
