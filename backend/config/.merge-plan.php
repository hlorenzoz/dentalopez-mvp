<?php

declare(strict_types=1);

// Do not edit. Content will be replaced.
return [
    '/' => [
        'di' => [
            'yiisoft/aliases' => [
                'config/di.php',
            ],
            'yiisoft/router-fastroute' => [
                'config/di.php',
            ],
            'yiisoft/router' => [
                'config/di.php',
            ],
            'yiisoft/yii-event' => [
                'config/di.php',
            ],
            '/' => [
                '$common',
            ],
        ],
        'params' => [
            'yiisoft/aliases' => [
                'config/params.php',
            ],
            'yiisoft/router-fastroute' => [
                'config/params.php',
            ],
            'yiisoft/router' => [
                'config/params.php',
            ],
            '/' => [
                'params.php',
            ],
        ],
        'di-web' => [
            'yiisoft/router-fastroute' => [
                'config/di-web.php',
            ],
            'yiisoft/error-handler' => [
                'config/di-web.php',
            ],
            'yiisoft/yii-event' => [
                'config/di-web.php',
            ],
            '/' => [
                '$di',
                'web/*.php',
            ],
        ],
        'events-web' => [
            'yiisoft/middleware-dispatcher' => [
                'config/events-web.php',
            ],
            '/' => [
                '$events',
                'events-web.php',
            ],
        ],
        'di-console' => [
            'yiisoft/yii-event' => [
                'config/di-console.php',
            ],
        ],
        'params-web' => [
            'yiisoft/yii-event' => [
                'config/params-web.php',
            ],
            '/' => [
                '$params',
            ],
        ],
        'events-console' => [],
        'params-console' => [
            'yiisoft/yii-event' => [
                'config/params-console.php',
            ],
        ],
        'common' => [
            '/' => [
                'common/*.php',
            ],
        ],
        'events' => [
            '/' => [
                'events.php',
            ],
        ],
        'providers' => [
            '/' => [
                'providers.php',
            ],
        ],
        'providers-web' => [
            '/' => [
                '$providers',
                'providers-web.php',
            ],
        ],
        'routes' => [
            '/' => [
                'routes.php',
            ],
        ],
    ],
];
