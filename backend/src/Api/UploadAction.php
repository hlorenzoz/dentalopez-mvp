<?php

declare(strict_types=1);

namespace App\Api;

use App\Infrastructure\FileRepositoryInterface;
use App\Infrastructure\McpClientInterface;
use Psr\Http\Message\ResponseFactoryInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use RuntimeException;

final readonly class UploadAction
{
    private const ALLOWED_MIMES = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'text/plain',
    ];

    private const MAX_BYTES = 10 * 1024 * 1024;

    public function __construct(
        private ResponseFactoryInterface $responseFactory,
        private FileRepositoryInterface $fileRepository,
        private McpClientInterface $mcpClient,
        private string $uploadDir,
    ) {}

    public function __invoke(ServerRequestInterface $request): ResponseInterface
    {
        $files = $request->getUploadedFiles();
        $uploaded = $files['file'] ?? null;

        if ($uploaded === null || $uploaded->getError() !== UPLOAD_ERR_OK) {
            return $this->json(['error' => 'No valid file uploaded'], 422);
        }

        $mimeType = $uploaded->getClientMediaType() ?? 'application/octet-stream';
        if (!in_array($mimeType, self::ALLOWED_MIMES, true)) {
            return $this->json(['error' => 'File type not allowed'], 400);
        }

        $fileSize = $uploaded->getSize() ?? 0;
        if ($fileSize > self::MAX_BYTES) {
            return $this->json(['error' => 'File exceeds 10 MB limit'], 400);
        }

        $jobId = bin2hex(random_bytes(16));
        $fileName = $uploaded->getClientFilename() ?? 'upload';
        $dir = rtrim($this->uploadDir, '/') . '/' . $jobId;

        if (!mkdir($dir, 0755, true) && !is_dir($dir)) {
            return $this->json(['error' => 'Failed to create upload directory'], 500);
        }

        $filePath = $dir . '/' . $fileName;
        $uploaded->moveTo($filePath);

        $this->fileRepository->insert($jobId, $fileName, $mimeType, $fileSize, $filePath);

        try {
            $this->mcpClient->process($jobId, $filePath, $fileName, $mimeType);
        } catch (RuntimeException $e) {
            return $this->json(['error' => 'Processing service unavailable: ' . $e->getMessage()], 502);
        }

        return $this->json([
            'jobId'     => $jobId,
            'streamUrl' => "/mcp/stream/{$jobId}",
        ], 202);
    }

    private function json(array $data, int $status): ResponseInterface
    {
        $response = $this->responseFactory->createResponse($status);
        $response->getBody()->write(json_encode($data, JSON_THROW_ON_ERROR));
        return $response->withHeader('Content-Type', 'application/json');
    }
}
