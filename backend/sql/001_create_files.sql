CREATE TABLE IF NOT EXISTS processed_files (
    id           CHAR(32)     PRIMARY KEY,
    file_name    VARCHAR(255) NOT NULL,
    mime_type    VARCHAR(100) NOT NULL,
    file_size    INT UNSIGNED NOT NULL,
    file_path    VARCHAR(512) NOT NULL,
    status       ENUM('pending','processing','complete','error') NOT NULL DEFAULT 'pending',
    summary      TEXT         NULL,
    classification JSON       NULL,
    email_sent   TINYINT(1)   NOT NULL DEFAULT 0,
    error_msg    TEXT         NULL,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME     NULL
);

CREATE TABLE IF NOT EXISTS processing_stages (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    job_id       CHAR(32)     NOT NULL,
    stage        VARCHAR(50)  NOT NULL,
    status       ENUM('pending','running','complete','error') NOT NULL DEFAULT 'pending',
    started_at   DATETIME     NULL,
    completed_at DATETIME     NULL,
    latency_ms   INT          NULL,
    logs         JSON         NULL,
    thinking     TEXT         NULL,
    api_request  JSON         NULL,
    api_response JSON         NULL,
    error_msg    TEXT         NULL,
    FOREIGN KEY (job_id) REFERENCES processed_files(id)
);
