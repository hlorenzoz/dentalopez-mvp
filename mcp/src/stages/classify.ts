import { getProvider } from '../providers/index.js';
import type { ClassifyResult, LogEvent } from '../types.js';

export async function classify(
  summary: string,
  fileName: string,
  emit: (event: Omit<LogEvent, 'timestamp'>) => void,
): Promise<ClassifyResult> {
  const result = await getProvider().classify(summary, emit);
  emit({ type: 'stage_log', stage: 'classify', message: `Category: ${result.category} | Priority: ${result.priority} | Confidence: ${result.confidence}` });
  return result;
}
