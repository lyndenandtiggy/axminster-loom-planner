export default function StudioPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-950 via-slate-900 to-emerald-950">
      <div className="text-center space-y-4">
        <span className="text-7xl" role="img" aria-label="rocket">
          🚀
        </span>
        <h1
          className="text-4xl font-black text-white"
          style={{ fontFamily: 'var(--font-nunito)' }}
        >
          Studio coming soon
        </h1>
        <p className="text-slate-400 text-lg" style={{ fontFamily: 'var(--font-nunito)' }}>
          Something awesome is being built here…
        </p>
      </div>
    </main>
  );
}
