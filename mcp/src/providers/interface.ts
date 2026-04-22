import type { ParseResult, ClassifyResult, LogEvent } from '../types.js';

export type EmitFn = (event: Omit<LogEvent, 'timestamp'>) => void;

export interface AIProvider {
  readonly name: string;
  analyze(parsed: ParseResult, fileName: string, emit: EmitFn): Promise<string>;
  classify(summary: string, emit: EmitFn): Promise<ClassifyResult>;
}
