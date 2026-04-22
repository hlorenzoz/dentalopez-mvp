'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogViewer } from './LogViewer';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain'];
const MAX_BYTES = 10 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUploadForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);

  const validate = (f: File): string | null => {
    if (!ALLOWED_TYPES.includes(f.type)) return 'File type not allowed. Use JPEG, PNG, GIF, WebP, PDF, or plain text.';
    if (f.size > MAX_BYTES) return 'File exceeds 10 MB limit.';
    return null;
  };

  const selectFile = (f: File) => {
    const err = validate(f);
    if (err) { setError(err); return; }
    setError(null);
    setFile(f);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) selectFile(f);
  }, []);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setError('Please select a file.'); return; }

    setLoading(true);
    setError(null);

    const form = new FormData();
    form.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      if (!res.ok) {
        const body = await res.json() as { error?: string };
        setError(body.error ?? `Upload failed (HTTP ${res.status})`);
        return;
      }
      const data = await res.json() as { jobId: string; streamUrl: string };
      setStreamUrl(data.streamUrl);
    } catch {
      setError('Network error — could not reach the server.');
    } finally {
      setLoading(false);
    }
  };

  if (streamUrl) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-4">
          <span className="stage-complete text-xl">✓</span>
          <span className="text-gray-300 text-sm font-mono">
            {file?.name} uploaded — processing…
          </span>
        </div>
        <LogViewer streamUrl={streamUrl} />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors"
        style={{
          borderColor: dragging ? '#6366f1' : '#30363d',
          backgroundColor: dragging ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) selectFile(f); }}
        />
        {file ? (
          <div className="flex flex-col items-center gap-2">
            <span className="text-3xl">📄</span>
            <span className="text-gray-200 font-mono text-sm">{file.name}</span>
            <span className="text-gray-500 text-xs">{formatBytes(file.size)}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <span className="text-3xl">⬆</span>
            <span className="text-sm">Drop a file here or click to browse</span>
            <span className="text-xs">JPEG · PNG · GIF · WebP · PDF · TXT — max 10 MB</span>
          </div>
        )}
      </div>

      {error && (
        <p className="stage-error text-sm font-mono">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || !file}
        className="px-6 py-3 rounded-lg font-semibold text-sm transition-opacity disabled:opacity-40"
        style={{ backgroundColor: '#6366f1', color: 'white' }}
      >
        {loading ? 'Uploading…' : 'Process File'}
      </button>
    </form>
  );
}
