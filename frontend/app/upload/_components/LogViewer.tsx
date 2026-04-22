'use client';

import { useEffect, useState } from 'react';
import { LogStage } from './LogStage';
import type { LogEvent, StageName, StageState } from '../../types';

const STAGE_ORDER: StageName[] = ['parse', 'analyze', 'classify', 'email'];

function initStages(): Map<StageName, StageState> {
  const m = new Map<StageName, StageState>();
  for (const name of STAGE_ORDER) {
    m.set(name, { name, status: 'pending', logs: [] });
  }
  return m;
}

export function LogViewer({ streamUrl }: { streamUrl: string }) {
  const [stages, setStages] = useState<Map<StageName, StageState>>(initStages);
  const [done, setDone] = useState(false);
  const [totalMs, setTotalMs] = useState<number | null>(null);
  const [startMs] = useState(() => Date.now());

  useEffect(() => {
    const es = new EventSource(streamUrl);

    es.onmessage = (e: MessageEvent<string>) => {
      const event: LogEvent = JSON.parse(e.data) as LogEvent;

      if (event.type === 'done') {
        setDone(true);
        setTotalMs(Date.now() - startMs);
        es.close();
        return;
      }

      if (!event.stage) return;
      const stageName = event.stage;

      setStages((prev) => {
        const next = new Map(prev);
        const stage = { ...(next.get(stageName) ?? { name: stageName, status: 'pending' as const, logs: [] }) };

        switch (event.type) {
          case 'stage_start':
            stage.status = 'running';
            break;
          case 'stage_complete':
            stage.status = 'complete';
            stage.latencyMs = event.latencyMs;
            break;
          case 'stage_error':
            stage.status = 'error';
            stage.errorMessage = event.message;
            stage.latencyMs = event.latencyMs;
            break;
          case 'stage_log':
            stage.logs = [...stage.logs, event];
            break;
          case 'stage_thinking':
            stage.thinking = typeof event.payload === 'string' ? event.payload : JSON.stringify(event.payload);
            break;
          case 'stage_api_request':
            stage.apiRequest = event.payload;
            break;
          case 'stage_api_response':
            stage.apiResponse = event.payload;
            break;
        }

        next.set(stageName, stage);
        return next;
      });
    };

    es.onerror = () => es.close();

    return () => es.close();
  }, [streamUrl, startMs]);

  return (
    <div className="mt-6" style={{ backgroundColor: '#0d1117', borderRadius: '8px', border: '1px solid #30363d', overflow: 'hidden' }}>
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <span className="text-sm font-mono text-gray-400">Processing pipeline</span>
        {done && totalMs !== null && (
          <span className="text-xs text-gray-500">Completed in {(totalMs / 1000).toFixed(1)}s</span>
        )}
      </div>
      <div className="p-3 flex flex-col gap-2">
        {STAGE_ORDER.map((name) => {
          const stage = stages.get(name);
          return stage ? <LogStage key={name} stage={stage} /> : null;
        })}
      </div>
      {done && (
        <div className="px-4 py-3 border-t border-gray-800 text-center">
          <a href="/files" className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors">
            View all files →
          </a>
        </div>
      )}
    </div>
  );
}
