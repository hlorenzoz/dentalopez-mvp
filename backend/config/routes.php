<?php

declare(strict_types=1);

use App\Api\FileDetailAction;
use App\Api\FileStatusAction;
use App\Api\HelloAction;
use App\Api\ListFilesAction;
use App\Api\UploadAction;
use Yiisoft\Router\Route;

return [
    Route::get('/api/hello')->action(HelloAction::class)->name('api/hello'),
    Route::post('/api/upload')->action(UploadAction::class)->name('api/upload'),
    Route::get('/api/files')->action(ListFilesAction::class)->name('api/files/list'),
    Route::get('/api/files/{jobId}')->action(FileDetailAction::class)->name('api/files/detail'),
    Route::patch('/api/files/{jobId}')->action(FileStatusAction::class)->name('api/files/status'),
];
