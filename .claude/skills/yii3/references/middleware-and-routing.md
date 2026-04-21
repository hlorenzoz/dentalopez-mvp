# Middleware and routing

Packages: `yiisoft/router`, `yiisoft/router-fastroute`, `yiisoft/yii-http`, and any PSR-15 middleware.

## Middleware

Yii's HTTP layer is PSR-7 + PSR-15. Middleware sits between request and response and either:
- calls `$handler->handle($request)` to delegate to the next stage, possibly with a modified request; or
- returns its own `ResponseInterface` directly.

### Implement

```php
use Psr\Http\Message\{ResponseInterface, ServerRequestInterface};
use Psr\Http\Server\{MiddlewareInterface, RequestHandlerInterface};

final readonly class Example implements MiddlewareInterface
{
    public function __construct(private ResponseFactoryInterface $responseFactory) {}

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        // Before: inspect/modify request, short-circuit, etc.
        // Short-circuit:
        //   return $this->responseFactory->createResponse(401);
        // Pass data to next layer:
        //   $request = $request->withAttribute('key', 'value');
        $response = $handler->handle($request);
        // After: modify response (add header, gzip, etc.)
        return $response;
    }
}
```

PSR-7 objects are **immutable** — `withHeader()`, `withAttribute()`, etc. return new instances.

### Register globally

In `config/web/application.php`:
```php
return [
    Yiisoft\Yii\Http\Application::class => [
        '__construct()' => [
            'dispatcher' => DynamicReference::to(static fn (Injector $i) =>
                $i->make(MiddlewareDispatcher::class)->withMiddlewares([
                    ErrorCatcher::class,
                    SessionMiddleware::class,
                    CsrfMiddleware::class,
                    // <- your middleware here
                    Router::class,
                ])
            ),
            'fallbackHandler' => Reference::to(NotFoundHandler::class),
        ],
    ],
];
```

Dispatcher runs the list in order; the last middleware (usually `Router`) produces the response; earlier middleware can post-process.

### Register per-route

Use `->middleware(Class::class)` or `->prependMiddleware(Class::class)` on a `Route` or `Group`:
```php
Route::get('/basic-auth')
    ->action([SiteController::class, 'auth'])
    ->name('site/auth')
    ->prependMiddleware(BasicAuthentication::class);
```

### DI config for middleware

If the middleware needs constructor arguments, configure in `config/web/*.php`:
```php
\Middlewares\BasicAuthentication::class => [
    'class' => \Middlewares\BasicAuthentication::class,
    '__construct()' => ['users' => ['foo' => 'bar']],
    'realm()' => ['Staging'],
    'attribute()' => ['username'],
],
```

## Routing

`config/routes.php` returns an array of `Route` / `Group` objects.

### Basics

```php
use Yiisoft\Http\Method;
use Yiisoft\Router\{Group, Route};

return [
    Route::get('/')->action([SiteController::class, 'index'])->name('site/index'),
    Route::post('/submit/{id:\d+}')->action([SiteController::class, 'submit'])->name('site/submit'),
    Route::methods([Method::GET, Method::POST], '/user[/{id}]')
        ->action([SiteController::class, 'user'])
        ->name('site/user')
        ->defaults(['id' => '42']),
];
```

HTTP verb methods: `get`, `post`, `put`, `delete`, `patch`, `head`, `options`, or `methods([...])`.

### Handler forms

- `[Class::class, 'methodName']` — class instantiated via DI, method called with per-request autowiring.
- `Class::class` — class with `__invoke` or a PSR-15 middleware/handler.
- `Closure` — called directly, parameters auto-wired.

### Named parameters

Syntax `{name}` or `{name:regex}`. Regex can't use capturing groups — use `{lang:en|de}` or `{lang:(?:en|de)}`, not `{lang:(en|de)}`. Plain `{name}` matches anything without a slash.

Examples:
- `/posts/{year:\d{4}}/{category}` matches `/posts/2014/php`
- `/post/{id:\d+}` matches `/post/100`

### Optional trailing segments

`/posts[/{id}]` matches both `/posts` and `/posts/42`. Use `->defaults(['id' => '1'])` for the missing case. Optional parts only allowed in trailing position.

### Groups

```php
Group::create('/api')
    ->middleware(ApiDataWrapper::class)
    ->routes(
        Route::get('/info')->action(ApiInfo::class)->name('api/info'),
        Route::get('/user/{login}')
            ->action([ApiUserController::class, 'profile'])
            ->middleware(JsonDataResponseMiddleware::class)
            ->name('api/user/profile'),
    ),
```

Group middleware wraps all contained routes. Nesting groups is allowed.

### Route arguments in actions

```php
use Yiisoft\Router\HydratorAttribute\RouteArgument;

public function __invoke(#[RouteArgument('id')] int $id): ResponseInterface { ... }
```

Or via `CurrentRoute`:
```php
public function __invoke(CurrentRoute $route): ResponseInterface {
    $id = $route->getArgument('id');
}
```

## URL generation

Inject `Yiisoft\Router\UrlGeneratorInterface`:

```php
public function __construct(private UrlGeneratorInterface $urlGenerator) {}

public function index(): ResponseInterface
{
    $url = $this->urlGenerator->generate('site/submit', ['id' => '42']);      // "/submit/42"
    $absolute = $this->urlGenerator->generateAbsolute('site/submit', ['id' => '42']);
}
```

In views, a `$url` generator is already available. Routes must have `->name(...)` to be generatable.

## Matching

Top-to-bottom, first match wins. If nothing matches, routing passes through to the next middleware (usually a 404 handler).

`Route::get('/foo')->host('admin.example.com')` limits to a host. Default implementation is `nikic/FastRoute`.
