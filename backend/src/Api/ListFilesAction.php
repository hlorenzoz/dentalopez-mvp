<?php

declare(strict_types=1);

namespace App\Api;

use App\Infrastructure\FileRepositoryInterface;
use Psr\Http\Message\ResponseFactoryInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final readonly class ListFilesAction
{
    public function __construct(
        private ResponseFactoryInterface $responseFactory,
        private FileRepositoryInterface $fileRepository,
    ) {}

    public function __invoke(ServerRequestInterface $request): ResponseInterface
    {
        $query = $request->getQueryParams();
        $limit = min((int) ($query['limit'] ?? 50), 100);
        $offset = (int) ($query['offset'] ?? 0);

        $files = $this->fileRepository->findAll($limit, $offset);

        $response = $this->responseFactory->createResponse(200);
        $response->getBody()->write(json_encode(['data' => $files], JSON_THROW_ON_ERROR));
        return $response->withHeader('Content-Type', 'application/json');
    }
}
