# Actions and views

Packages: `yiisoft/view`, `yiisoft/yii-view-renderer`, `yiisoft/html`.

## Actions

An "action" is the middleware that actually produces the response — typically at the end of the middleware chain, selected by the router.

### Single-action class (preferred for complex handlers)

```php
use Psr\Http\Message\{ResponseInterface, ServerRequestInterface};

final readonly class FrontPageAction
{
    public function __invoke(ServerRequestInterface $request): ResponseInterface
    {
        // ...
    }
}
```

Register: `Route::get('/')->action(FrontPageAction::class)`.

### Controller (multiple actions grouped)

```php
use Psr\Http\Message\{ResponseInterface, ServerRequestInterface};
use Psr\Log\LoggerInterface;

final readonly class PostController
{
    public function __construct(
        private PostRepository $posts,     // shared across all actions in this controller
    ) {}

    public function actionIndex(ServerRequestInterface $request, LoggerInterface $logger): ResponseInterface
    {
        $logger->debug('Rendering posts list');
        // ...
    }

    public function actionView(ServerRequestInterface $request): ResponseInterface { /* ... */ }
}
```

Register:
```php
Route::get('/post/index')->action([PostController::class, 'actionIndex']),
Route::get('/post/view/{id:\d+}')->action([PostController::class, 'actionView']),
```

### Two-level autowiring

1. **Constructor** gets shared / expensive dependencies (repositories, renderer, translator).
2. **Method** gets per-request dependencies (`ServerRequestInterface`, `LoggerInterface`, `UrlGeneratorInterface`, route args via `#[RouteArgument]`).

Never inject `ContainerInterface`. Never return anything other than `ResponseInterface`.

## Views

Templates are PHP files. For web apps, the `yiisoft/app` template stores them alongside their action (e.g. `src/Web/Echo/template.php` next to `src/Web/Echo/Action.php`). Layouts live in `src/Web/Shared/Layout/Main/`.

### Rendering

Inject `Yiisoft\Yii\View\Renderer\WebViewRenderer`:

```php
use Psr\Http\Message\ResponseInterface;
use Yiisoft\Router\HydratorAttribute\RouteArgument;
use Yiisoft\Yii\View\Renderer\WebViewRenderer;

final readonly class Action
{
    public function __construct(private WebViewRenderer $viewRenderer) {}

    public function __invoke(#[RouteArgument('message')] string $message = 'Hello!'): ResponseInterface
    {
        return $this->viewRenderer->render(__DIR__ . '/template', ['message' => $message]);
    }
}
```

First arg: template path (no `.php`). Second arg: data array — keys become variables in the template.

### Template

```php
<?php
use Yiisoft\Html\Html;
/* @var string $message */
?>
<p>The message is: <?= Html::encode($message) ?></p>
```

**Always** use `Html::encode()` for user data. `yiisoft/html` helpers produce escaped output by default.

### Layout

Configure default layout in `config/common/params.php`:
```php
return [
    'yiisoft/yii-view-renderer' => [
        'viewPath' => null,
        'layout' => '@src/Web/Shared/Layout/Main/layout.php',
    ],
];
```

Layout receives the rendered child as `$content`:
```php
<?php
/** @var string $content */
/** @var Yiisoft\Aliases\Aliases $aliases */
/** @var string|null $csrf */
/** @var Yiisoft\View\WebView $this */
/** @var Yiisoft\Router\UrlGeneratorInterface $urlGenerator */
?>
<!DOCTYPE html>
<html>
  <head><?php $this->head() ?></head>
  <body><?= $content ?></body>
</html>
```

Set a different layout per action: `$this->viewRenderer->withLayout('@layout/other')->render(...)` or `->withoutLayout()->render(...)`.

### View injections

Automatic per-render parameters come from `ViewInjection` classes registered in `config/common/params.php`:

```php
'yiisoft/yii-view-renderer' => [
    'injections' => [
        Reference::to(ContentViewInjection::class),
        Reference::to(CsrfViewInjection::class),
        Reference::to(LayoutViewInjection::class),
    ],
],
```

An injection provides `getCommonParameters()` / `getParameters()` / `getLayoutParameters()` / `getCommonMetaTags()`. That's how `$urlGenerator`, `$csrf`, `$applicationParams` etc. arrive into every template without manually passing them.

### Asset bundles

Packages: `yiisoft/assets`. Define `AssetBundle` classes in `assets/` (or `src/Web/Shared/Layout/Main/MainAsset.php`). Register in the layout:
```php
$assetManager->register(MainAsset::class);
$cssFiles = $assetManager->getCssFiles();
$jsFiles = $assetManager->getJsFiles();
```

### Template engines

Plain PHP is default. For Twig: `yiisoft/yii-view-twig`. For Blade: `lee-to/yii-blade`. Register the engine in DI and swap the renderer.

### Widgets

Reusable view components come from `yiisoft/widget`. Pattern: `SomeWidget::widget()->withSomething(...)->render()`. Use `->begin()` / `->end()` for wrapping content.

## Response shortcuts

Inject `Psr\Http\Message\ResponseFactoryInterface` for non-HTML responses:

```php
$response = $this->responseFactory->createResponse();
$response->getBody()->write(json_encode(['ok' => true]));
return $response->withHeader('Content-Type', 'application/json');
```

Or use `Yiisoft\DataResponse\DataResponseFactoryInterface` when available — it handles content-negotiated serialization.
