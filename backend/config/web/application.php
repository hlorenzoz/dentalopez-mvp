<?php

declare(strict_types=1);

use Yiisoft\Definitions\DynamicReference;
use Yiisoft\Definitions\Reference;
use Yiisoft\ErrorHandler\Middleware\ErrorCatcher;
use Yiisoft\Injector\Injector;
use Yiisoft\Middleware\Dispatcher\MiddlewareDispatcher;
use Yiisoft\Router\Middleware\Router;
use Yiisoft\Yii\Http\Application;
use Yiisoft\Yii\Http\Handler\NotFoundHandler;

return [
    Application::class => [
        '__construct()' => [
            'dispatcher' => DynamicReference::to(static fn (Injector $i) =>
                $i->make(MiddlewareDispatcher::class)->withMiddlewares([
                    ErrorCatcher::class,
                    Router::class,
                ])
            ),
            'fallbackHandler' => Reference::to(NotFoundHandler::class),
        ],
    ],
];
