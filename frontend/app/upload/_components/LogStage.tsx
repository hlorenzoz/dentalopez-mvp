'use client';

import { useState } from 'react';
import type { StageState } from '../../types';

const STAGE_LABELS: Record<string, string> = {
  parse: 'Parse file',
  analyze: 'Analyze with AI',
  classify: 'Classify document',
  email: 'Send email',
};

function StatusIcon({ status }: { status: StageState['status'] }) {
  if (status === 'complete') return <span className="stage-complete text-base">✓</span>;
  if (status === 'error') return <span className="stage-error text-base">✗</span>;
  if (status === 'running') return <span className="stage-running text-base">⟳</span>;
  return <span className="text-gray-500 text-base">○</span>;
}

export function LogStage({ stage }: { stage: StageState }) {
  const [open, setOpen] = useState(false);

  const hasContent =
    stage.logs.length > 0 ||
    stage.thinking !== undefined ||
    stage.apiRequest !== undefined ||
    stage.apiResponse !== undefined ||
    stage.errorMessage !== undefined;

  return (
    <div className="border border-gray-800 rounded-md overflow-hidden">
      <button
        type="button"
        onClick={() => hasContent && setOpen((v) => !v)}
        className="w-full flex items-center gap-3 p-3 font-mono text-sm hover:bg-white/5 transition-colors text-left"
        style={{ cursor: hasContent ? 'pointer' : 'default' }}
      >
        <StatusIcon status={stage.status} />
        <span className="flex-1 text-gray-200">{STAGE_LABELS[stage.name] ?? stage.name}</span>
        {stage.latencyMs !== undefined && (
          <span className="text-xs text-gray-500">{stage.latencyMs}ms</span>
        )}
        {hasContent && (
          <span className="text-gray-600 text-xs">{open ? '▲' : '▼'}</span>
        )}
      </button>

      {open && hasContent && (
        <div className="border-t border-gray-800 log-mono">
          {stage.errorMessage && (
            <div className="px-4 py-2 stage-error border-l-2 border-red-700">
              {stage.errorMessage}
            </div>
          )}
          {stage.thinking && (
            <Subsection label="Thinking">
              <pre className="whitespace-pre-wrap text-gray-400">{stage.thinking as string}</pre>
            </Subsection>
          )}
          {stage.apiRequest !== undefined && (
            <Subsection label="API Request">
              <pre className="whitespace-pre-wrap text-gray-400">
                {JSON.stringify(stage.apiRequest, null, 2)}
              </pre>
            </Subsection>
          )}
          {stage.apiResponse !== undefined && (
            <Subsection label="API Response">
              <pre className="whitespace-pre-wrap text-gray-400">
                {JSON.stringify(stage.apiResponse, null, 2)}
              </pre>
            </Subsection>
          )}
          {stage.logs
            .filter((e) => e.type === 'stage_log')
            .map((e, i) => (
              <div
                key={i}
                className="px-4 py-1 border-l-2 border-gray-700 text-gray-300"
              >
                {e.message}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function Subsection({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-gray-800">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-1 text-left text-gray-500 hover:text-gray-400 flex items-center gap-2 transition-colors"
      >
        <span>{open ? '▼' : '▶'}</span>
        <span>{label}</span>
      </button>
      {open && <div className="px-4 pb-2">{children}</div>}
    </div>
  );
}
