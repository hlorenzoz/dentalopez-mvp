<?php

declare(strict_types=1);

namespace App\Tests\Infrastructure;

use App\Infrastructure\HttpMcpClient;
use PHPUnit\Framework\TestCase;
use RuntimeException;

final class HttpMcpClientTest extends TestCase
{
    public function testThrowsWhenServiceUnreachable(): void
    {
        $client = new HttpMcpClient('http://127.0.0.1:19999');

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('MCP service unreachable');

        $client->process('abc', '/uploads/abc/file.jpg', 'file.jpg', 'image/jpeg');
    }
}
