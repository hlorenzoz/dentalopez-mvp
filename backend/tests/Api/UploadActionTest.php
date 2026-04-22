<?php

declare(strict_types=1);

namespace App\Tests\Api;

use App\Api\UploadAction;
use App\Infrastructure\FileRepositoryInterface;
use App\Infrastructure\McpClientInterface;
use HttpSoft\Message\ResponseFactory;
use HttpSoft\Message\ServerRequestFactory;
use HttpSoft\Message\UploadedFileFactory;
use Mockery;
use Mockery\MockInterface;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\UploadedFileInterface;
use RuntimeException;

final class UploadActionTest extends TestCase
{
    private ResponseFactory $responseFactory;
    private FileRepositoryInterface&MockInterface $fileRepository;
    private McpClientInterface&MockInterface $mcpClient;
    private string $tmpDir;

    protected function setUp(): void
    {
        $this->responseFactory = new ResponseFactory();
        $this->fileRepository  = Mockery::mock(FileRepositoryInterface::class);
        $this->mcpClient       = Mockery::mock(McpClientInterface::class);
        $this->tmpDir          = sys_get_temp_dir() . '/dentalopez_test_' . uniqid();
        mkdir($this->tmpDir, 0755, true);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        exec("rm -rf {$this->tmpDir}");
    }

    public function testReturnsJobIdAndStreamUrl(): void
    {
        $this->fileRepository->shouldReceive('insert')->once();
        $this->mcpClient->shouldReceive('process')->once();

        $action = new UploadAction(
            $this->responseFactory,
            $this->fileRepository,
            $this->mcpClient,
            $this->tmpDir,
        );

        $file = $this->makeUploadedFile('test.jpg', 'image/jpeg', 1024);
        $request = (new ServerRequestFactory())->createServerRequest('POST', '/api/upload')
            ->withUploadedFiles(['file' => $file]);

        $response = ($action)($request);

        $this->assertSame(202, $response->getStatusCode());
        $body = json_decode((string) $response->getBody(), true);
        $this->assertArrayHasKey('jobId', $body);
        $this->assertStringContainsString('/mcp/stream/', $body['streamUrl']);
    }

    public function testRejectsEmptyUpload(): void
    {
        $action = new UploadAction(
            $this->responseFactory,
            $this->fileRepository,
            $this->mcpClient,
            $this->tmpDir,
        );

        $request = (new ServerRequestFactory())->createServerRequest('POST', '/api/upload');
        $response = ($action)($request);

        $this->assertSame(422, $response->getStatusCode());
    }

    public function testRejectsDisallowedMimeType(): void
    {
        $action = new UploadAction(
            $this->responseFactory,
            $this->fileRepository,
            $this->mcpClient,
            $this->tmpDir,
        );

        $file = $this->makeUploadedFile('virus.exe', 'application/octet-stream', 512);
        $request = (new ServerRequestFactory())->createServerRequest('POST', '/api/upload')
            ->withUploadedFiles(['file' => $file]);

        $response = ($action)($request);

        $this->assertSame(400, $response->getStatusCode());
    }

    public function testRejectsOversizedFile(): void
    {
        $action = new UploadAction(
            $this->responseFactory,
            $this->fileRepository,
            $this->mcpClient,
            $this->tmpDir,
        );

        $file = $this->makeUploadedFile('big.jpg', 'image/jpeg', 11 * 1024 * 1024);
        $request = (new ServerRequestFactory())->createServerRequest('POST', '/api/upload')
            ->withUploadedFiles(['file' => $file]);

        $response = ($action)($request);

        $this->assertSame(400, $response->getStatusCode());
    }

    public function testHandlesMcpServiceError(): void
    {
        $this->fileRepository->shouldReceive('insert')->once();
        $this->mcpClient->shouldReceive('process')->once()->andThrow(new RuntimeException('Connection refused'));

        $action = new UploadAction(
            $this->responseFactory,
            $this->fileRepository,
            $this->mcpClient,
            $this->tmpDir,
        );

        $file = $this->makeUploadedFile('test.png', 'image/png', 512);
        $request = (new ServerRequestFactory())->createServerRequest('POST', '/api/upload')
            ->withUploadedFiles(['file' => $file]);

        $response = ($action)($request);

        $this->assertSame(502, $response->getStatusCode());
    }

    private function makeUploadedFile(string $name, string $mime, int $size): UploadedFileInterface
    {
        $factory = new UploadedFileFactory();
        $tmpFile = tempnam(sys_get_temp_dir(), 'upload_');
        file_put_contents($tmpFile, str_repeat('x', min($size, 1024)));
        $stream = (new \HttpSoft\Message\StreamFactory())->createStreamFromFile($tmpFile);
        return $factory->createUploadedFile($stream, $size, UPLOAD_ERR_OK, $name, $mime);
    }
}
