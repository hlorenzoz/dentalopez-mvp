<?php

declare(strict_types=1);

use Yiisoft\Yii\Runner\Http\HttpApplicationRunner;

require_once dirname(__DIR__) . '/vendor/autoload.php';

(new HttpApplicationRunner(
    rootPath: dirname(__DIR__),
    debug: (bool) ($_SERVER['YII_DEBUG'] ?? false),
    checkEvents: false,
    environment: null,
))->run();
