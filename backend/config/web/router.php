<?php

declare(strict_types=1);

use Yiisoft\Config\ConfigInterface;
use Yiisoft\Router\RouteCollection;
use Yiisoft\Router\RouteCollectionInterface;
use Yiisoft\Router\RouteCollectorInterface;

return [
    RouteCollectionInterface::class => static function (
        RouteCollectorInterface $collector,
        ConfigInterface $config,
    ): RouteCollection {
        $collector->addRoute(...$config->get('routes'));
        return new RouteCollection($collector);
    },
];
