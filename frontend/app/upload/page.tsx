import { FileUploadForm } from './_components/FileUploadForm';

export default function UploadPage() {
  return (
    <main className="min-h-screen flex items-start justify-center p-8 pt-16">
      <div
        className="w-full max-w-2xl rounded-xl px-8 py-8 shadow-2xl"
        style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-white">Process a Dental File</h1>
          <p className="text-gray-400 text-sm mt-1">
            Upload an image, PDF, or text file. Claude will analyze it and send a summary by email.
          </p>
        </div>
        <FileUploadForm />
      </div>
    </main>
  );
}
