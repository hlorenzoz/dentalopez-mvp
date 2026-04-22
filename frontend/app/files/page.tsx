import type { FileRecord } from '../types';

const BASE = process.env.BACKEND_INTERNAL_URL ?? 'http://caddy';

async function getFiles(): Promise<FileRecord[]> {
  try {
    const res = await fetch(`${BASE}/api/files`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = (await res.json()) as { data: FileRecord[] };
    return data.data;
  } catch {
    return [];
  }
}

const STATUS_COLORS: Record<string, string> = {
  pending:    'text-gray-400',
  processing: 'text-yellow-400',
  complete:   'text-green-400',
  error:      'text-red-400',
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'text-red-400',
  high:   'text-orange-400',
  normal: 'text-gray-300',
  low:    'text-gray-500',
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function FilesPage() {
  const files = await getFiles();

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-white">Uploaded Files</h1>
          <a
            href="/upload"
            className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#6366f1', color: 'white' }}
          >
            + Upload
          </a>
        </div>

        {files.length === 0 ? (
          <div
            className="rounded-xl p-12 text-center text-gray-500"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            No files yet.{' '}
            <a href="/upload" className="text-indigo-400 hover:text-indigo-300">
              Upload one →
            </a>
          </div>
        ) : (
          <div
            className="rounded-xl overflow-hidden"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 font-mono text-xs">
                  <th className="text-left px-4 py-3">File</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Category</th>
                  <th className="text-left px-4 py-3">Priority</th>
                  <th className="text-left px-4 py-3">Size</th>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {files.map((f) => (
                  <tr key={f.id} className="border-b border-gray-800 last:border-0 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-mono text-gray-200 max-w-48 truncate">{f.file_name}</td>
                    <td className={`px-4 py-3 font-mono ${STATUS_COLORS[f.status] ?? 'text-gray-400'}`}>{f.status}</td>
                    <td className="px-4 py-3 text-gray-400">{f.classification?.category ?? '—'}</td>
                    <td className={`px-4 py-3 font-mono ${PRIORITY_COLORS[f.classification?.priority ?? ''] ?? 'text-gray-400'}`}>
                      {f.classification?.priority ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatBytes(f.file_size)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{f.created_at}</td>
                    <td className="px-4 py-3">
                      <a
                        href={`/files/${f.id}`}
                        className="text-indigo-400 hover:text-indigo-300 transition-colors text-xs"
                      >
                        View logs →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
