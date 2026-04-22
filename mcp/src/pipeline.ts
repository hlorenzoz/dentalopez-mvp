import { pushEvent, markDone } from './store.js';
import { parse } from './stages/parse.js';
import { analyze } from './stages/analyze.js';
import { classify } from './stages/classify.js';
import { sendEmail } from './stages/email.js';
import type { LogEvent, StageName, StageResult } from './types.js';

function now(): string {
  return new Date().toISOString();
}

function makeEmit(jobId: string) {
  return (partial: Omit<LogEvent, 'timestamp'>) => {
    pushEvent(jobId, { ...partial, timestamp: now() });
  };
}

async function runStage<T>(
  jobId: string,
  stage: StageName,
  fn: () => Promise<T>,
): Promise<T> {
  const emit = makeEmit(jobId);
  const startMs = Date.now();

  emit({ type: 'stage_start', stage });

  try {
    const result = await fn();
    emit({ type: 'stage_complete', stage, latencyMs: Date.now() - startMs });
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    emit({ type: 'stage_error', stage, message, latencyMs: Date.now() - startMs });
    throw err;
  }
}

export async function runPipeline(
  jobId: string,
  filePath: string,
  fileName: string,
  mimeType: string,
): Promise<void> {
  const emit = makeEmit(jobId);
  const result: StageResult = {};

  try {
    const parsed = await runStage(jobId, 'parse', () => parse(filePath, mimeType));

    const stageEmit = (partial: Omit<LogEvent, 'timestamp'>) =>
      pushEvent(jobId, { ...partial, timestamp: now() });

    result.summary = await runStage(jobId, 'analyze', () =>
      analyze(parsed, fileName, stageEmit),
    );

    result.classification = await runStage(jobId, 'classify', () =>
      classify(result.summary!, fileName, stageEmit),
    );

    await runStage(jobId, 'email', () =>
      sendEmail(jobId, fileName, filePath, result.summary!, result.classification!, stageEmit),
    );

    await notifyBackend(jobId, 'complete', result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    emit({ type: 'error', message });
    await notifyBackend(jobId, 'error', result, message).catch(() => {});
  } finally {
    emit({ type: 'done' });
    markDone(jobId);
  }
}

async function notifyBackend(
  jobId: string,
  status: 'complete' | 'error',
  result: StageResult,
  errorMsg?: string,
): Promise<void> {
  const backendUrl = process.env.BACKEND_URL ?? 'http://backend';
  const body = JSON.stringify({
    status,
    summary: result.summary ?? null,
    classification: result.classification ?? null,
    error_msg: errorMsg ?? null,
  });

  await fetch(`${backendUrl}/api/files/${jobId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
}
