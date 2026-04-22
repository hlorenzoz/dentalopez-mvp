import { getProvider } from '../providers/index.js';
import type { ParseResult, LogEvent } from '../types.js';

export async function analyze(
  parsed: ParseResult,
  fileName: string,
  emit: (event: Omit<LogEvent, 'timestamp'>) => void,
): Promise<string> {
  return getProvider().analyze(parsed, fileName, emit);
}
