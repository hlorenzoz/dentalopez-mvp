<?php

declare(strict_types=1);

namespace App\Infrastructure;

use PDO;

final readonly class DbFileRepository implements FileRepositoryInterface
{
    public function __construct(private PDO $pdo) {}

    public function insert(
        string $jobId,
        string $fileName,
        string $mimeType,
        int $fileSize,
        string $filePath,
    ): void {
        $stmt = $this->pdo->prepare(
            'INSERT INTO processed_files (id, file_name, mime_type, file_size, file_path, status)
             VALUES (:id, :file_name, :mime_type, :file_size, :file_path, :status)',
        );
        $stmt->execute([
            'id'        => $jobId,
            'file_name' => $fileName,
            'mime_type' => $mimeType,
            'file_size' => $fileSize,
            'file_path' => $filePath,
            'status'    => 'processing',
        ]);
    }

    public function findById(string $jobId): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM processed_files WHERE id = :id');
        $stmt->execute(['id' => $jobId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row !== false ? $row : null;
    }

    public function findAll(int $limit = 50, int $offset = 0): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM processed_files ORDER BY created_at DESC LIMIT :limit OFFSET :offset',
        );
        $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue('offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function updateStatus(
        string $jobId,
        string $status,
        ?string $summary = null,
        ?array $classification = null,
        ?string $errorMsg = null,
    ): void {
        $stmt = $this->pdo->prepare(
            'UPDATE processed_files
             SET status = :status,
                 summary = :summary,
                 classification = :classification,
                 error_msg = :error_msg,
                 completed_at = CASE WHEN :status2 IN (\'complete\', \'error\') THEN NOW() ELSE NULL END
             WHERE id = :id',
        );
        $stmt->execute([
            'id'             => $jobId,
            'status'         => $status,
            'status2'        => $status,
            'summary'        => $summary,
            'classification' => $classification !== null ? json_encode($classification, JSON_THROW_ON_ERROR) : null,
            'error_msg'      => $errorMsg,
        ]);
    }
}
