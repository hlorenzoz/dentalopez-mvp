# Databases and migrations

Packages: `yiisoft/db`, `yiisoft/db-mysql` / `yiisoft/db-pgsql` / `yiisoft/db-sqlite` / `yiisoft/db-mssql` / `yiisoft/db-oracle`, `yiisoft/active-record`, `yiisoft/db-migration`.

## Connection

Install a driver (e.g. `composer require yiisoft/db-pgsql`) and configure in `config/common/*.php` (or `config/common/db.php`). Read values from `$params`:

```php
// config/params.php (excerpt)
'yiisoft/db-pgsql' => [
    'dsn' => 'pgsql:host=localhost;port=5432;dbname=app',
    'username' => 'app',
    'password' => 'secret',
    'charset' => 'utf8',
],
```

Connection config pulls those params and binds `Yiisoft\Db\Connection\ConnectionInterface` to the chosen driver's connection class.

## Yii DB (query builder / DAO)

```php
use Yiisoft\Db\Connection\ConnectionInterface;

final readonly class PostRepository
{
    public function __construct(private ConnectionInterface $db) {}

    public function all(): array
    {
        return $this->db
            ->createCommand('SELECT * FROM post WHERE status = :s', [':s' => 'published'])
            ->queryAll();
    }
}
```

Prefer the query builder for dynamic queries:
```php
$rows = (new Query($this->db))
    ->from('post')
    ->where(['status' => 'published'])
    ->andWhere(['>', 'created_at', $since])
    ->orderBy(['created_at' => SORT_DESC])
    ->limit(10)
    ->all();
```

Always use parameter bindings or array-form `where` — never concatenate user input into SQL.

Docs: https://github.com/yiisoft/db/blob/master/docs/guide/en/README.md

## Active Record

Package: `yiisoft/active-record`. Each model is a class extending `Yiisoft\ActiveRecord\ActiveRecord`:

```php
use Yiisoft\ActiveRecord\ActiveRecord;

final class Post extends ActiveRecord
{
    public static function tableName(): string { return 'post'; }
}
```

Usage:
```php
$post = Post::find()->where(['id' => 42])->one();
$post->title = 'Updated';
$post->save();
```

AR instances require a connection — inject `ConnectionInterface` and pass it to the model factory, or configure `ConnectionProvider`. Docs: https://github.com/yiisoft/active-record

## Migrations (`yiisoft/db-migration`)

### Setup

```sh
composer require yiisoft/db-migration
mkdir -p src/Migration
```

In `config/common/params.php`:
```php
'yiisoft/db-migration' => [
    'newMigrationNamespace' => 'App\\Migration',
    'sourceNamespaces' => ['App\\Migration'],
    // Optional: 'newMigrationPath' for a non-namespace location.
    // Optional: 'sourcePaths' for external migration directories (e.g. from RBAC-DB).
],
```

### Workflow

```sh
./yii migrate:create <name>            # creates src/Migration/M<date>_<name>.php
./yii migrate:up                       # apply pending
./yii migrate:down                     # roll back one
./yii migrate:redo                     # down + up
./yii migrate:history                  # applied migrations
./yii migrate:new                      # pending migrations
```

### Writing a migration

```php
namespace App\Migration;

use Yiisoft\Db\Migration\MigrationBuilder;
use Yiisoft\Db\Migration\RevertibleMigrationInterface;

final class M260401000000CreatePost implements RevertibleMigrationInterface
{
    public function up(MigrationBuilder $b): void
    {
        $b->createTable('post', [
            'id' => $b->primaryKey(),
            'title' => $b->string(255)->notNull(),
            'body' => $b->text(),
            'created_at' => $b->timestamp()->notNull()->defaultExpression('CURRENT_TIMESTAMP'),
        ]);
        $b->createIndex('idx-post-title', 'post', 'title');
    }

    public function down(MigrationBuilder $b): void
    {
        $b->dropTable('post');
    }
}
```

### Rules

- Migrations should be **independent of application code** — do not `use App\...` entity classes. Application code evolves, migrations must stay reproducible.
- When manipulating data, write raw queries or use the migration's builder — not your Active Record models.
- Commit migrations alongside the feature that needs them; never edit an applied migration — create a new one.
- For seeding RBAC, cache clearing, or other non-DDL operations, a migration is still valid — just keep it self-contained.

### Multiple sources

Third-party packages (e.g., `yiisoft/rbac-db`) ship their own migrations. Add their paths to `sourcePaths`:
```php
'yiisoft/db-migration' => [
    'newMigrationNamespace' => 'App\\Migration',
    'sourceNamespaces' => ['App\\Migration'],
    'sourcePaths' => [
        __DIR__ . '/../../vendor/yiisoft/rbac-db/migrations/items',
        __DIR__ . '/../../vendor/yiisoft/rbac-db/migrations/assignments',
    ],
],
```
