# Console commands and runtime environments

Packages: `yiisoft/yii-console`, `symfony/console`, `yiisoft/yii-runner-*`.

## Console commands

Yii uses Symfony Console. The `./yii` script (project root) is the console entry; it boots a console-specific DI container from `config/console/*.php` + `config/common/*.php`.

### Implement

```php
namespace App\Command;

use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Yiisoft\Yii\Console\ExitCode;

#[AsCommand(name: 'hello', description: 'Greets the user')]
final class Hello extends Command
{
    public function __construct(private readonly MyService $service)
    {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $output->writeln($this->service->greet());
        return ExitCode::OK;
    }
}
```

Constructor dependencies are autowired via DI.

### Register

In `config/params.php`:
```php
'yiisoft/yii-console' => [
    'commands' => [
        'hello' => App\Command\Hello::class,
        'rbac:init' => App\Command\RbacCommand::class,
    ],
],
```

Run: `./yii hello` (or `make yii hello` with Docker).

### Input / output

- Options & arguments: use `InputDefinition` or `#[Argument]` / `#[Option]` attributes from Symfony Console.
- Formatted output: `SymfonyStyle` helper (`new SymfonyStyle($input, $output)`).
- Progress: `$output->createProgressBar($total)`.
- Exit codes: `ExitCode::OK`, `ExitCode::ERROR`, `ExitCode::USAGE`, etc.

## Event-loop runtimes

Traditional PHP bootstraps the container on every request. With long-running runtimes, the container is created once and requests are handled in a loop. Yii supports:

- **RoadRunner** (`yiisoft/yii-runner-roadrunner`) — Go-based HTTP server, mature, wide adoption.
- **FrankenPHP** (`yiisoft/yii-runner-frankenphp`) — Caddy-based modern option.
- **Swoole** (`yiisoft/yii-runner-swoole`) — pure PHP extension, coroutines.
- **ReactPHP** — via `yiisoft/yii-runner-react` (generic event loop).

### Key constraints

Under these runtimes the application instance is reused. That means:

1. **Do not rely on globals** — `$_GET`/`$_POST`/`$_SERVER` reflect the first request, not the current one. PSR-7 request objects are the source of truth.
2. **No module-level mutable state.** Static caches that outlive a request leak across requests.
3. **Services registered as shared in DI persist across requests.** Either make them immutable, or flush per-request state in an `AfterEmit` event handler.
4. **Watch memory.** Profile with real traffic — leaks that were invisible in fpm show up fast.
5. **File changes don't hot-reload PHP.** The runtime must be restarted (RoadRunner has worker restart on change in dev).

Package READMEs have concrete setup (entry script, worker script, config). See `guide/tutorial/using-yii-with-roadrunner.md` (and siblings) in the zip for integration specifics.

## Performance tuning

Common wins:
- Enable OPcache (`opcache.validate_timestamps=0` in production, preload with `opcache.preload`).
- Cache compiled config: the config plugin's merge is at runtime — for large apps, consider compiled container dumps.
- Avoid rebuilding services per request; DI shared scope is default.
- Use event-loop runtime (above) for tail latency.
- Profile with Xdebug / Blackfire / Tideways before optimising.

## Docker

`yiisoft/app` ships with `docker/` directory and Makefile targets:
- `make up` — start stack.
- `make down` — stop.
- `make shell` — exec into PHP container.
- `make composer require <pkg>` — run composer inside the container.
- `make yii <command>` — run a console command.
- Configure dev port via `DEV_PORT` in `docker/.env`.

Production: multi-stage Dockerfile, run `composer install --no-dev --optimize-autoloader`, set `APP_ENV=prod`, bake OPcache config.
