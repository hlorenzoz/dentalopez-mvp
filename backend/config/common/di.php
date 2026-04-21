<?php

declare(strict_types=1);

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

return [
    LoggerInterface::class => NullLogger::class,
    ResponseFactoryInterface::class => ResponseFactory::class,
    ServerRequestFactoryInterface::class => ServerRequestFactory::class,
    StreamFactoryInterface::class => StreamFactory::class,
    UploadedFileFactoryInterface::class => UploadedFileFactory::class,
    UriFactoryInterface::class => UriFactory::class,
];
