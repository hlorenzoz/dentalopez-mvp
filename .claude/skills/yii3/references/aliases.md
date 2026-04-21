# Aliases

Package: `yiisoft/aliases`.

An alias is a string starting with `@` that represents a path or URL. It keeps configs portable and paths centralised.

## Predefined (from `yiisoft/app`)

| Alias | Meaning |
| --- | --- |
| `@root` | Application base directory |
| `@assets` | Public asset directory (`@root/public/assets`) |
| `@assetsUrl` | URL of published assets (`/assets`) |
| `@baseUrl` | App base URL (`/`) |
| `@npm` | Node modules directory |
| `@vendor` | Composer vendor directory |
| `@public` | Publicly accessible directory (contains `index.php`) |
| `@runtime` | Writable runtime directory (`@root/runtime`) |
| `@resources` | Views, translation messages, asset sources |
| `@layout` | Default layout directory (`@resources/views/layout`) |
| `@views` | View template base directory (`@resources/views`) |
| `@message` | Translation messages (`@root/resources/message`) |

## Defining

In `config/params.php`:

```php
return [
    'yiisoft/aliases' => [
        'aliases' => [
            '@foo' => '/path/to/foo',
            '@bar' => 'https://www.example.com',
            '@foobar' => '@foo/bar',        // alias-of-alias is fine
        ],
    ],
];
```

If you omit the leading `@`, it's added automatically.

Derived aliases are just path-joined: if `@foo` = `/path/to/foo`, then `@foo/bar/file.php` resolves to `/path/to/foo/bar/file.php`.

You can override derivations — defining `@foo/bar` = `/path2/bar` makes `@foo/bar/file.php` resolve to `/path2/bar/file.php` while `@foo/test/file.php` stays at `/path/to/foo/test/file.php`.

## Resolving

Inject `Yiisoft\Aliases\Aliases` where you need the raw string:

```php
public function __invoke(Aliases $aliases): void
{
    $foo = $aliases->get('@foo');                      // "/path/to/foo"
    $file = $aliases->get('@foo/bar/file.php');        // "/path/to/foo/bar/file.php"
}
```

`get()` doesn't check that the target file/URL exists.

## Using aliases in DI config

Prefer resolving aliases **at the config level**, so services receive ready strings:

```php
return [
    FileCache::class => static fn (Aliases $aliases) =>
        new FileCache($aliases->get($params['yiisoft/cache-file']['fileCache']['path'])),
];
```

This keeps business logic free of alias resolution calls.

## Runtime mutation

```php
public function __invoke(Aliases $aliases): void
{
    $aliases->set('@uploads', '@root/uploads');
}
```

Avoid this where possible — prefer declaring in `params.php` so the set of aliases is static and discoverable.
