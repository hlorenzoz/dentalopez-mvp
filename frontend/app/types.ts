export type LogEventType =
  | 'stage_start'
  | 'stage_log'
  | 'stage_thinking'
  | 'stage_api_request'
  | 'stage_api_response'
  | 'stage_complete'
  | 'stage_error'
  | 'done'
  | 'error';

export type StageName = 'parse' | 'analyze' | 'classify' | 'email';

export interface LogEvent {
  type: LogEventType;
  stage?: StageName;
  message?: string;
  payload?: unknown;
  latencyMs?: number;
  timestamp: string;
}

export type StageStatus = 'pending' | 'running' | 'complete' | 'error';

export interface StageState {
  name: StageName;
  status: StageStatus;
  logs: LogEvent[];
  latencyMs?: number;
  thinking?: string;
  apiRequest?: unknown;
  apiResponse?: unknown;
  errorMessage?: string;
}

export interface FileRecord {
  id: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  file_path: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  summary: string | null;
  classification: {
    category: string;
    priority: string;
    action: string;
    confidence: number;
  } | null;
  email_sent: number;
  error_msg: string | null;
  created_at: string;
  completed_at: string | null;
}
