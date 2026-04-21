<?php

declare(strict_types=1);

namespace App\Tests\Api;

use App\Api\HelloAction;
use HttpSoft\Message\ResponseFactory;
use PHPUnit\Framework\TestCase;

final class HelloActionTest extends TestCase
{
    public function testReturnsJsonHelloWorld(): void
    {
        $action = new HelloAction(new ResponseFactory());
        $response = ($action)();

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame('application/json', $response->getHeaderLine('Content-Type'));
        $this->assertSame(
            ['message' => 'Hello World'],
            json_decode((string) $response->getBody(), true, flags: JSON_THROW_ON_ERROR),
        );
    }
}
