export default function ParentPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-950 via-slate-900 to-slate-950">
      <div className="text-center space-y-4">
        <span className="text-7xl" role="img" aria-label="settings">
          ⚙️
        </span>
        <h1
          className="text-4xl font-black text-white"
          style={{ fontFamily: 'var(--font-nunito)' }}
        >
          Parent settings coming soon
        </h1>
        <p className="text-slate-400 text-lg" style={{ fontFamily: 'var(--font-nunito)' }}>
          Controls for time limits, content filters, and usage logs.
        </p>
      </div>
    </main>
  );
}
