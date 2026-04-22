<?php

declare(strict_types=1);

namespace App\Infrastructure;

use RuntimeException;

final readonly class HttpMcpClient implements McpClientInterface
{
    public function __construct(private string $mcpUrl) {}

    public function process(string $jobId, string $filePath, string $fileName, string $mimeType): void
    {
        $body = json_encode([
            'jobId'    => $jobId,
            'filePath' => $filePath,
            'fileName' => $fileName,
            'mimeType' => $mimeType,
        ], JSON_THROW_ON_ERROR);

        $context = stream_context_create([
            'http' => [
                'method'  => 'POST',
                'header'  => "Content-Type: application/json\r\nContent-Length: " . strlen($body),
                'content' => $body,
                'ignore_errors' => true,
                'timeout' => 5,
            ],
        ]);

        $result = @file_get_contents($this->mcpUrl . '/process', false, $context);

        if ($result === false) {
            throw new RuntimeException('MCP service unreachable');
        }

        $http = $http_response_header ?? [];
        $status = 0;
        foreach ($http as $line) {
            if (preg_match('#HTTP/\d+\.\d+\s+(\d+)#', $line, $m)) {
                $status = (int) $m[1];
            }
        }

        if ($status < 200 || $status >= 300) {
            throw new RuntimeException("MCP service returned HTTP {$status}");
        }
    }
}
