<?php

declare(strict_types=1);

$host = $_SERVER['DB_HOST'] ?? getenv('DB_HOST') ?: 'db';
$name = $_SERVER['DB_NAME'] ?? getenv('DB_NAME') ?: 'dentalopez';
$user = $_SERVER['DB_USER'] ?? getenv('DB_USER') ?: 'dentalopez';
$pass = $_SERVER['DB_PASSWORD'] ?? getenv('DB_PASSWORD') ?: '';

$pdo = new PDO("mysql:host={$host};dbname={$name};charset=utf8mb4", $user, $pass, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
]);

$sql = file_get_contents(dirname(__DIR__) . '/sql/001_create_files.sql');
foreach (array_filter(array_map('trim', explode(';', $sql))) as $stmt) {
    $pdo->exec($stmt);
    echo "OK: " . substr($stmt, 0, 60) . "...\n";
}

echo "Migration complete.\n";
