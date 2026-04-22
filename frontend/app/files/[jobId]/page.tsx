import { LogViewer } from '../../upload/_components/LogViewer';
import type { FileRecord } from '../../types';

const BASE = process.env.BACKEND_INTERNAL_URL ?? 'http://caddy';

async function getFile(jobId: string): Promise<FileRecord | null> {
  try {
    const res = await fetch(`${BASE}/api/files/${jobId}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json() as Promise<FileRecord>;
  } catch {
    return null;
  }
}

export default async function FileDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const file = await getFile(jobId);

  if (!file) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <p className="text-gray-400">File not found.</p>
      </main>
    );
  }

  const isLive = file.status === 'processing' || file.status === 'pending';

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-2">
          <a href="/files" className="text-indigo-400 hover:text-indigo-300 text-sm">← All files</a>
        </div>

        <div
          className="rounded-xl px-6 py-6 mb-6"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <h1 className="text-xl font-semibold text-white mb-3 font-mono">{file.file_name}</h1>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <Detail label="Status" value={file.status} />
            <Detail label="MIME" value={file.mime_type} />
            <Detail label="Uploaded" value={file.created_at} />
            {file.completed_at && <Detail label="Completed" value={file.completed_at} />}
            {file.classification && (
              <>
                <Detail label="Category" value={file.classification.category} />
                <Detail label="Priority" value={file.classification.priority} />
                <Detail label="Action" value={file.classification.action} />
                <Detail label="Confidence" value={`${(file.classification.confidence * 100).toFixed(0)}%`} />
              </>
            )}
          </dl>
          {file.summary && (
            <div className="mt-4 pt-4 border-t border-gray-800">
              <p className="text-xs text-gray-500 mb-2 font-mono">Summary</p>
              <p className="text-gray-300 text-sm leading-relaxed">{file.summary}</p>
            </div>
          )}
          {file.error_msg && (
            <div className="mt-4 pt-4 border-t border-gray-800">
              <p className="text-xs text-red-400 font-mono">{file.error_msg}</p>
            </div>
          )}
        </div>

        {isLive ? (
          <LogViewer streamUrl={`/mcp/stream/${jobId}`} />
        ) : (
          <div
            className="rounded-xl px-6 py-4 text-sm text-gray-500 text-center font-mono"
            style={{ backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            Processing complete — live log stream unavailable. Stage details are stored in the database.
          </div>
        )}
      </div>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-500 font-mono">{label}</dt>
      <dd className="text-gray-300">{value}</dd>
    </div>
  );
}
