import { EventEmitter } from 'events';
import type { JobState, LogEvent } from './types.js';

const JOB_TTL_MS = 10 * 60 * 1000;

const jobs = new Map<string, JobState>();
const emitters = new Map<string, EventEmitter>();

export function createJob(
  jobId: string,
  filePath: string,
  fileName: string,
  mimeType: string,
): void {
  jobs.set(jobId, {
    jobId,
    filePath,
    fileName,
    mimeType,
    events: [],
    done: false,
    createdAt: Date.now(),
  });
  emitters.set(jobId, new EventEmitter());

  setTimeout(() => {
    jobs.delete(jobId);
    emitters.delete(jobId);
  }, JOB_TTL_MS);
}

export function getJob(jobId: string): JobState | undefined {
  return jobs.get(jobId);
}

export function pushEvent(jobId: string, event: LogEvent): void {
  const job = jobs.get(jobId);
  if (job) {
    job.events.push(event);
  }
  emitters.get(jobId)?.emit('event', event);
}

export function getEmitter(jobId: string): EventEmitter | undefined {
  return emitters.get(jobId);
}

export function markDone(jobId: string): void {
  const job = jobs.get(jobId);
  if (job) {
    job.done = true;
  }
}
