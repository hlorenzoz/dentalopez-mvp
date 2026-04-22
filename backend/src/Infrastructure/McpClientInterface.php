<?php

declare(strict_types=1);

namespace App\Infrastructure;

interface McpClientInterface
{
    public function process(string $jobId, string $filePath, string $fileName, string $mimeType): void;
}
