# Security, authentication, authorization

Packages: `yiisoft/user`, `yiisoft/auth`, `yiisoft/security`, `yiisoft/access`, `yiisoft/rbac` (+ storage backends).

## Principles

1. **Filter input** — never trust it; whitelist allowed values at the boundary.
2. **Escape output** — `Yiisoft\Html\Html::encode()` for HTML text. Use `HtmlPurifier` for user-supplied HTML (heavy — cache it).
3. **Parameterized SQL** — PDO prepared statements via `yiisoft/db`. For dynamic column/table names, whitelist:
   ```php
   if (!in_array($orderBy, ['name', 'status'], true)) {
       throw new \InvalidArgumentException('Invalid order.');
   }
   ```
4. **CSRF** — keep `Yiisoft\Yii\Web\Middleware\Csrf` in the middleware stack. GET must never change state.
5. **Never ship debug or Gii in production.** Disable `yiisoft/yii-debug`, restrict access by IP if absolutely required.
6. **TLS everywhere.** Don't disable SSL peer verification; configure `openssl.cafile` / `curl.cainfo` in `php.ini`.

## Passwords (`yiisoft/security`)

```php
use Yiisoft\Security\PasswordHasher;

$hash = (new PasswordHasher())->hash($password);
// store $hash

$ok = (new PasswordHasher())->validate($submittedPassword, $storedHash);
```

Defaults to `argon2`. Never store plaintext, never `md5`/`sha*`.

## Authentication

Goal: wire up `Yiisoft\User\CurrentUser` backed by your own identity.

### 1. Configure `CurrentUser`

```php
use Yiisoft\Session\{Session, SessionInterface};
use Yiisoft\Auth\IdentityRepositoryInterface;
use Yiisoft\Definitions\Reference;
use Yiisoft\User\CurrentUser;

return [
    SessionInterface::class => [
        'class' => Session::class,
        '__construct()' => [$params['session']['options'] ?? [], $params['session']['handler'] ?? null],
    ],
    IdentityRepositoryInterface::class => App\User\IdentityRepository::class,
    CurrentUser::class => [
        'withSession()' => [Reference::to(SessionInterface::class)],
    ],
];
```

### 2. Implement `IdentityInterface`

```php
use Yiisoft\Auth\IdentityInterface;

final readonly class Identity implements IdentityInterface
{
    public function __construct(private string $id) {}
    public function getId(): string { return $this->id; }
}
```

### 3. Implement `IdentityRepositoryInterface`

Lookup by ID (session restore) and by credentials (login). Typically backed by a DB repository.

### 4. Logging in / out

```php
public function login(CurrentUser $user, IdentityInterface $identity): void
{
    $user->login($identity);
}

public function logout(CurrentUser $user): void
{
    $user->logout();
}
```

`CurrentUser` is auto-injectable into actions. It exposes `getId()`, `getIdentity()`, `isGuest()`, `can()`.

## Authorization

Interface: `Yiisoft\Access\AccessCheckerInterface::userHasPermission($userId, string $permission, array $params): bool`.

### Basic check

```php
final readonly class PostController
{
    public function __construct(
        private PostRepositoryInterface $posts,
        private CurrentUser $user,
    ) {}

    public function update(#[RouteArgument('id')] int $id): ResponseInterface
    {
        $post = $this->posts->findByPK($id);
        if ($post === null) { /* 404 */ }

        if (!$this->user->can('updatePost', ['post' => $post])) { /* 403 */ }
        // ...
    }
}
```

### RBAC (`yiisoft/rbac`)

Pick a storage:
- `yiisoft/rbac-php` — flat file, good for small apps.
- `yiisoft/rbac-db` — database via Yii DB.
- `yiisoft/rbac-cycle-db` — Cycle DBAL.

Wire in DI:
```php
use Yiisoft\Rbac\{ItemsStorageInterface, AssignmentsStorageInterface, ManagerInterface};
use Yiisoft\Access\AccessCheckerInterface;
use Yiisoft\User\CurrentUser;
use Yiisoft\Definitions\Reference;

return [
    ItemsStorageInterface::class       => Yiisoft\Rbac\Php\ItemsStorage::class,
    AssignmentsStorageInterface::class => Yiisoft\Rbac\Php\AssignmentsStorage::class,
    AccessCheckerInterface::class      => ManagerInterface::class,
    CurrentUser::class => [
        'withAccessChecker()' => [Reference::to(AccessCheckerInterface::class)],
    ],
];
```

For DB storage, also register items/assignments storage migrations in `params.php` under `yiisoft/db-migration.sourcePaths`, then `./yii migrate:up`.

### Building the hierarchy

Two good options:
- **Console command** — best when hierarchy is stable and seeded once. `#[AsCommand(name: 'rbac:init')]` → call `$manager->addPermission`, `->addRole`, `->addChild`, `->assign`.
- **Migration** — same API, but runs with other DB migrations.

Never hardcode `$manager->assign($role, $userId)` for dynamic users — do it at signup or via an admin UI.

### Rules (contextual constraints)

```php
use Yiisoft\Rbac\{Item, RuleContext, RuleInterface};

final readonly class AuthorRule implements RuleInterface
{
    public function execute(?string $userId, Item $item, RuleContext $context): bool
    {
        $post = $context->getParameterValue('post');
        return $post !== null && (string) $post->getAuthorId() === $userId;
    }
}
```

Attach to a permission:
```php
$updateOwn = (new Permission('updateOwnPost'))
    ->withDescription('Update own post')
    ->withRuleName(AuthorRule::class);
$manager->addPermission($updateOwn);
$manager->addChild($updateOwn->getName(), $updatePost->getName());
$manager->addChild($authorRole->getName(), $updateOwn->getName());
```

Pass the rule parameter at check time: `$user->can('updatePost', ['post' => $post])`.

### Custom access checker

Bypass RBAC entirely by implementing `AccessCheckerInterface` directly and binding it in DI. Useful for static permission tables or integration with an external authz service.

## Cryptography (`yiisoft/security`)

Use the package's `Crypt`, `Mac`, `Random`, `PasswordHasher` classes rather than raw `openssl_*` calls. Never roll your own.
