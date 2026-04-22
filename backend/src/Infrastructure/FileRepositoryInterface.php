<?php

declare(strict_types=1);

namespace App\Infrastructure;

interface FileRepositoryInterface
{
    public function insert(
        string $jobId,
        string $fileName,
        string $mimeType,
        int $fileSize,
        string $filePath,
    ): void;

    /** @return array<string, mixed>|null */
    public function findById(string $jobId): ?array;

    /** @return list<array<string, mixed>> */
    public function findAll(int $limit = 50, int $offset = 0): array;

    public function updateStatus(
        string $jobId,
        string $status,
        ?string $summary = null,
        ?array $classification = null,
        ?string $errorMsg = null,
    ): void;
}
