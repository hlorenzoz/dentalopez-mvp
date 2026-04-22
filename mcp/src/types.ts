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

export interface JobState {
  jobId: string;
  filePath: string;
  fileName: string;
  mimeType: string;
  events: LogEvent[];
  done: boolean;
  createdAt: number;
}

export interface ParseResult {
  text: string;
  mimeType: string;
  imageBase64?: string;
}

export interface ClassifyResult {
  category: string;
  priority: string;
  action: string;
  confidence: number;
}

export interface StageResult {
  summary?: string;
  classification?: ClassifyResult;
}
