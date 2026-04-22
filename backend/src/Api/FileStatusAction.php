<?php

declare(strict_types=1);

namespace App\Api;

use App\Infrastructure\FileRepositoryInterface;
use Psr\Http\Message\ResponseFactoryInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final readonly class FileStatusAction
{
    public function __construct(
        private ResponseFactoryInterface $responseFactory,
        private FileRepositoryInterface $fileRepository,
    ) {}

    public function __invoke(ServerRequestInterface $request, string $jobId): ResponseInterface
    {
        $body = (array) json_decode((string) $request->getBody(), true, flags: JSON_THROW_ON_ERROR);

        $status = (string) ($body['status'] ?? 'complete');
        $summary = isset($body['summary']) ? (string) $body['summary'] : null;
        $classification = isset($body['classification']) && is_array($body['classification'])
            ? $body['classification']
            : null;
        $errorMsg = isset($body['error_msg']) ? (string) $body['error_msg'] : null;

        $this->fileRepository->updateStatus($jobId, $status, $summary, $classification, $errorMsg);

        $response = $this->responseFactory->createResponse(200);
        $response->getBody()->write(json_encode(['ok' => true], JSON_THROW_ON_ERROR));
        return $response->withHeader('Content-Type', 'application/json');
    }
}
