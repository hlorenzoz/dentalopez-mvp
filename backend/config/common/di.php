<?php

declare(strict_types=1);

use App\Infrastructure\DbFileRepository;
use App\Infrastructure\FileRepositoryInterface;
use App\Infrastructure\HttpMcpClient;
use App\Infrastructure\McpClientInterface;
use HttpSoft\Message\ResponseFactory;
use HttpSoft\Message\ServerRequestFactory;
use HttpSoft\Message\StreamFactory;
use HttpSoft\Message\UploadedFileFactory;
use HttpSoft\Message\UriFactory;
use Psr\Http\Message\ResponseFactoryInterface;
use Psr\Http\Message\ServerRequestFactoryInterface;
use Psr\Http\Message\StreamFactoryInterface;
use Psr\Http\Message\UploadedFileFactoryInterface;
use Psr\Http\Message\UriFactoryInterface;
use Psr\Log\LoggerInterface;
use Psr\Log\NullLogger;
use Yiisoft\Config\ConfigInterface;
use Yiisoft\Definitions\DynamicReference;

return [
    LoggerInterface::class => NullLogger::class,
    ResponseFactoryInterface::class => ResponseFactory::class,
    ServerRequestFactoryInterface::class => ServerRequestFactory::class,
    StreamFactoryInterface::class => StreamFactory::class,
    UploadedFileFactoryInterface::class => UploadedFileFactory::class,
    UriFactoryInterface::class => UriFactory::class,

    PDO::class => DynamicReference::to(static function (ConfigInterface $config): PDO {
        $db = $config->get('params')['db'];
        return new PDO(
            "mysql:host={$db['host']};dbname={$db['name']};charset=utf8mb4",
            $db['user'],
            $db['password'],
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION],
        );
    }),

    FileRepositoryInterface::class => DbFileRepository::class,

    McpClientInterface::class => DynamicReference::to(
        static fn (ConfigInterface $config): HttpMcpClient =>
            new HttpMcpClient($config->get('params')['mcp']['url']),
    ),

    \App\Api\UploadAction::class => DynamicReference::to(
        static function (
            ResponseFactoryInterface $responseFactory,
            FileRepositoryInterface $fileRepository,
            McpClientInterface $mcpClient,
            ConfigInterface $config,
        ): \App\Api\UploadAction {
            return new \App\Api\UploadAction(
                $responseFactory,
                $fileRepository,
                $mcpClient,
                $config->get('params')['app']['uploadDir'],
            );
        },
    ),
];
