import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileUploadForm } from './FileUploadForm';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

global.fetch = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

describe('FileUploadForm', () => {
  it('renders drop zone with instructional text', () => {
    render(<FileUploadForm />);
    expect(screen.getByText(/Drop a file here or click to browse/i)).toBeInTheDocument();
  });

  it('shows file name after selecting a file', async () => {
    render(<FileUploadForm />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['content'], 'dental.jpg', { type: 'image/jpeg' });

    await userEvent.upload(input, file);
    expect(screen.getByText('dental.jpg')).toBeInTheDocument();
  });

  it('shows error for disallowed file type', async () => {
    render(<FileUploadForm />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['x'], 'virus.exe', { type: 'application/octet-stream' });

    await userEvent.upload(input, file);
    expect(screen.getByText(/File type not allowed/i)).toBeInTheDocument();
  });

  it('calls fetch /api/upload on submit and shows log viewer on success', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ jobId: 'abc123', streamUrl: '/mcp/stream/abc123' }),
    });

    global.EventSource = vi.fn().mockImplementation(() => ({
      onmessage: null,
      onerror: null,
      close: vi.fn(),
    })) as unknown as typeof EventSource;

    render(<FileUploadForm />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, new File(['content'], 'doc.pdf', { type: 'application/pdf' }));

    fireEvent.submit(screen.getByRole('button', { name: /Process File/i }).closest('form')!);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/upload', expect.objectContaining({ method: 'POST' }));
    });
  });

  it('displays error message on API failure', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ error: 'No valid file uploaded' }),
    });

    render(<FileUploadForm />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, new File(['x'], 'test.jpg', { type: 'image/jpeg' }));

    fireEvent.submit(screen.getByRole('button', { name: /Process File/i }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/No valid file uploaded/i)).toBeInTheDocument();
    });
  });
});
