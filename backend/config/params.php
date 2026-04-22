<?php

declare(strict_types=1);

return [
    'app' => [
        'name'          => 'DentaLopez API',
        'uploadDir'     => '/uploads',
        'maxUploadBytes' => 10 * 1024 * 1024,
        'allowedMimes'  => [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf',
            'text/plain',
        ],
    ],
    'db' => [
        'host'     => $_SERVER['DB_HOST'] ?? getenv('DB_HOST') ?: 'db',
        'name'     => $_SERVER['DB_NAME'] ?? getenv('DB_NAME') ?: 'dentalopez',
        'user'     => $_SERVER['DB_USER'] ?? getenv('DB_USER') ?: 'dentalopez',
        'password' => $_SERVER['DB_PASSWORD'] ?? getenv('DB_PASSWORD') ?: '',
    ],
    'mcp' => [
        'url' => $_SERVER['MCP_URL'] ?? getenv('MCP_URL') ?: 'http://mcp:3001',
    ],
    'yiisoft/aliases' => [
        'aliases' => [
            '@root'    => dirname(__DIR__),
            '@runtime' => '@root/runtime',
            '@public'  => '@root/public',
            '@src'     => '@root/src',
        ],
    ],
];
