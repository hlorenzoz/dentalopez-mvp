async function getMessage(): Promise<string> {
  const base = process.env.BACKEND_INTERNAL_URL ?? "http://caddy";
  const res = await fetch(`${base}/api/hello`, { cache: "no-store" });
  if (!res.ok) return "Backend unreachable";
  const data = (await res.json()) as { message: string };
  return data.message;
}

export default async function Page() {
  const message = await getMessage();
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-xl px-10 py-8 shadow-2xl">
        <p className="text-white text-2xl font-semibold tracking-tight">
          {message}
        </p>
      </div>
    </main>
  );
}
