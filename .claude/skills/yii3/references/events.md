# Events

Package: `yiisoft/event-dispatcher` (PSR-14).

## Event classes

Events are **plain classes**, not strings. Prefer `final readonly` with public promoted properties as the event's payload:

```php
final readonly class UserSignedUp
{
    public function __construct(public SignupForm $form) {}
}
```

## Dispatch

Inject `Psr\EventDispatcher\EventDispatcherInterface`:

```php
use Psr\EventDispatcher\EventDispatcherInterface;

final readonly class SignupService
{
    public function __construct(private EventDispatcherInterface $dispatcher) {}

    public function signup(SignupForm $form): void
    {
        // ... persist ...
        $this->dispatcher->dispatch(new UserSignedUp($form));
    }
}
```

## Handlers

An event handler is any PHP callable `function (EventClass $event): void`.

### Configure via `config/events.php` (or `-web` / `-console`)

```php
return [
    UserSignedUp::class => [
        // Plain closure
        static fn (UserSignedUp $event) => someStuff($event),

        // Closure with extra deps — autowired after the event parameter
        static fn (UserSignedUp $event, Mailer $mailer) => $mailer->send($event),

        // Static method
        [SomeClass::class, 'staticMethodName'],

        // Instance method — `SomeClass` is instantiated by DI
        [SomeClass::class, 'methodName'],

        // Pre-built invokable
        new InvokableClass(),

        // Invokable class — instantiated by DI
        InvokableClass::class,

        // DI alias (any string the container can resolve)
        'di-alias',
    ],
];
```

Files:
- `events.php` — applies to both web and console.
- `events-web.php` — web only (merged with `events.php` via `$events` reference in `composer.json` `config-plugin`).
- `events-console.php` — console only.

### Attach at runtime (rare)

Inject `Yiisoft\EventDispatcher\Provider\Provider` and call `$provider->attach($callback)`. The event type is inferred from the callable's first parameter type.

```php
$provider->attach([$this, 'handleUserSignup']);
```

`$provider->detach(EventClass::class)` to remove.

## Hierarchies replace wildcards

There are no string patterns or wildcards. Use class/interface hierarchies:

```php
interface DocumentEvent {}
final readonly class BeforeDocumentProcessed implements DocumentEvent {}
final readonly class AfterDocumentProcessed implements DocumentEvent {}
```

A handler typed as `DocumentEvent` receives **all** events implementing that interface:

```php
$provider->attach(static function (DocumentEvent $event) {
    // fires for both BeforeDocumentProcessed and AfterDocumentProcessed
});
```

## Stoppable events

Implement `Psr\EventDispatcher\StoppableEventInterface` on the event if handlers should be able to halt further propagation:

```php
final class CriticalEvent implements StoppableEventInterface
{
    private bool $stopped = false;
    public function isPropagationStopped(): bool { return $this->stopped; }
    public function stop(): void { $this->stopped = true; }
}
```

Once a handler returns with `isPropagationStopped() === true`, later handlers are skipped.

## Handler order

Handlers run in attachment order. **Don't rely on order** — if two handlers must coordinate, redesign so one dispatches a follow-up event.

## Built-in lifecycle events

From `yiisoft/yii-http`:
- `ApplicationStartup` — before request handling begins.
- `AfterEmit` — after the response was sent to the client.
- `ApplicationShutdown` — application is shutting down.

Use these for boot hooks, cleanup, metrics flushing.
