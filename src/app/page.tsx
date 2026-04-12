'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

type Mode = 'arthur' | 'axminster' | 'parent';

const MODE_CONFIG = {
  arthur: {
    title: "Arthur's Studio",
    emoji: '🎬',
    placeholder: 'Type your password…',
    button: "Let's Go!",
    buttonColor: 'bg-green-400 hover:bg-green-300 text-green-950',
    redirect: '/studio',
  },
  axminster: {
    title: 'Axminster',
    emoji: '🏭',
    placeholder: 'Business password…',
    button: 'Sign in',
    buttonColor: 'bg-blue-500 hover:bg-blue-400 text-white',
    redirect: '/studio',
  },
  parent: {
    title: 'Parent Settings',
    emoji: '🔒',
    placeholder: 'Enter PIN…',
    button: 'Unlock',
    buttonColor: 'bg-purple-500 hover:bg-purple-400 text-white',
    redirect: '/parent',
  },
} as const;

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('arthur');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const cfg = MODE_CONFIG[mode];

  function switchMode(next: Mode) {
    setMode(next);
    setPassword('');
    setError('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, mode }),
      });

      if (res.ok) {
        router.push(cfg.redirect);
      } else {
        const data = await res.json();
        setError(data.error ?? 'Something went wrong — try again!');
      }
    } catch {
      setError('Could not connect — check your internet!');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-400 via-cyan-300 to-emerald-400 p-4">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 flex flex-col gap-6">

          {/* Header */}
          <div className="text-center">
            <span className="text-6xl leading-none" role="img" aria-label={cfg.title}>
              {cfg.emoji}
            </span>
            <h1
              className="mt-3 text-3xl font-black tracking-tight text-slate-800"
              style={{ fontFamily: 'var(--font-nunito)' }}
            >
              {cfg.title}
            </h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={cfg.placeholder}
              autoComplete="current-password"
              required
              className="
                w-full rounded-2xl border-2 border-slate-200 bg-slate-50
                px-5 py-4 text-lg text-slate-800 placeholder-slate-400
                focus:border-cyan-400 focus:outline-none focus:ring-0
                transition-colors
              "
              style={{ fontFamily: 'var(--font-nunito)' }}
            />

            {error && (
              <p className="text-center text-sm font-semibold text-red-500">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className={`
                w-full rounded-2xl py-4 text-xl font-black
                shadow-lg active:scale-95 transition-all duration-150
                disabled:opacity-50 disabled:cursor-not-allowed
                ${cfg.buttonColor}
              `}
              style={{ fontFamily: 'var(--font-nunito)' }}
            >
              {loading ? '…' : cfg.button}
            </button>
          </form>

          {/* Mode switchers */}
          <div className="flex justify-between text-xs text-slate-400">
            {mode !== 'parent' ? (
              <button
                onClick={() => switchMode('parent')}
                className="hover:text-slate-600 transition-colors underline underline-offset-2"
              >
                Parent settings
              </button>
            ) : (
              <button
                onClick={() => switchMode('arthur')}
                className="hover:text-slate-600 transition-colors underline underline-offset-2"
              >
                ← Back
              </button>
            )}

            {mode !== 'axminster' ? (
              <button
                onClick={() => switchMode('axminster')}
                className="hover:text-slate-600 transition-colors underline underline-offset-2"
              >
                Axminster
              </button>
            ) : (
              <button
                onClick={() => switchMode('arthur')}
                className="hover:text-slate-600 transition-colors underline underline-offset-2"
              >
                ← Back
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
