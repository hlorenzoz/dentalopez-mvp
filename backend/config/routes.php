<?php

declare(strict_types=1);

use App\Api\HelloAction;
use Yiisoft\Router\Route;

return [
    Route::get('/api/hello')->action(HelloAction::class)->name('api/hello'),
];
