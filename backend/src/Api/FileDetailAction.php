<?php

declare(strict_types=1);

namespace App\Api;

use App\Infrastructure\FileRepositoryInterface;
use Psr\Http\Message\ResponseFactoryInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final readonly class FileDetailAction
{
    public function __construct(
        private ResponseFactoryInterface $responseFactory,
        private FileRepositoryInterface $fileRepository,
    ) {}

    public function __invoke(ServerRequestInterface $request, string $jobId): ResponseInterface
    {
        $file = $this->fileRepository->findById($jobId);

        if ($file === null) {
            $response = $this->responseFactory->createResponse(404);
            $response->getBody()->write(json_encode(['error' => 'Not found'], JSON_THROW_ON_ERROR));
            return $response->withHeader('Content-Type', 'application/json');
        }

        $response = $this->responseFactory->createResponse(200);
        $response->getBody()->write(json_encode($file, JSON_THROW_ON_ERROR));
        return $response->withHeader('Content-Type', 'application/json');
    }
}
