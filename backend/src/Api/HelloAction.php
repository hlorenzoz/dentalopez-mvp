<?php

declare(strict_types=1);

namespace App\Api;

use Psr\Http\Message\ResponseFactoryInterface;
use Psr\Http\Message\ResponseInterface;

final readonly class HelloAction
{
    public function __construct(private ResponseFactoryInterface $responseFactory) {}

    public function __invoke(): ResponseInterface
    {
        $response = $this->responseFactory->createResponse();
        $response->getBody()->write(json_encode(['message' => 'Hello World'], JSON_THROW_ON_ERROR));
        return $response->withHeader('Content-Type', 'application/json');
    }
}
