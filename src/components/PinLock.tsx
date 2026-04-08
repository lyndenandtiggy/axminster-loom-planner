'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const PIN = '1755';

export default function PinLock() {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unlocked = localStorage.getItem('unlocked');
    if (unlocked === 'true') {
      router.replace('/dashboard');
    }
  }, [router]);

  const handlePress = (digit: string) => {
    if (input.length >= 4) return;
    const next = input + digit;
    setInput(next);
    setError(false);

    if (next.length === 4) {
      if (next === PIN) {
        localStorage.setItem('unlocked', 'true');
        router.push('/dashboard');
      } else {
        setError(true);
        setShake(true);
        setTimeout(() => {
          setInput('');
          setError(false);
          setShake(false);
        }, 600);
      }
    }
  };

  const handleBackspace = () => {
    setInput((prev) => prev.slice(0, -1));
    setError(false);
  };

  const dots = Array.from({ length: 4 }, (_, i) => i < input.length);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a0f]">
      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#6366f1]/5 rounded-full blur-3xl" />
      </div>

      <div className={`relative z-10 flex flex-col items-center gap-8 ${shake ? 'animate-shake' : ''}`}>
        {/* Logo/Title */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#6366f1" fillOpacity="0.15" />
              <rect x="6" y="10" width="20" height="2" rx="1" fill="#6366f1" />
              <rect x="6" y="15" width="20" height="2" rx="1" fill="#6366f1" />
              <rect x="6" y="20" width="20" height="2" rx="1" fill="#6366f1" />
              <rect x="10" y="8" width="2" height="16" rx="1" fill="#818cf8" />
              <rect x="20" y="8" width="2" height="16" rx="1" fill="#818cf8" />
            </svg>
            <h1 className="text-2xl font-semibold tracking-tight text-[#e2e8f0]">
              Axminster Loom Planner
            </h1>
          </div>
          <p className="text-sm text-[#64748b]">Enter your PIN to continue</p>
        </div>

        {/* PIN dots */}
        <div className="flex gap-4">
          {dots.map((filled, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-150 ${
                error
                  ? 'bg-red-500'
                  : filled
                  ? 'bg-[#6366f1] scale-110'
                  : 'bg-[#1e1e2e] border border-[#2d2d42]'
              }`}
            />
          ))}
        </div>

        {/* Error message */}
        <div className={`text-sm text-red-400 transition-opacity duration-200 ${error ? 'opacity-100' : 'opacity-0'}`}>
          Incorrect PIN. Try again.
        </div>

        {/* Number pad */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              onClick={() => handlePress(String(n))}
              className="w-16 h-16 rounded-xl bg-[#12121a] border border-[#1e1e2e] text-[#e2e8f0] text-xl font-medium
                hover:bg-[#1a1a28] hover:border-[#6366f1]/40 active:scale-95
                transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50"
            >
              {n}
            </button>
          ))}
          <div /> {/* spacer */}
          <button
            onClick={() => handlePress('0')}
            className="w-16 h-16 rounded-xl bg-[#12121a] border border-[#1e1e2e] text-[#e2e8f0] text-xl font-medium
              hover:bg-[#1a1a28] hover:border-[#6366f1]/40 active:scale-95
              transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="w-16 h-16 rounded-xl bg-[#12121a] border border-[#1e1e2e] text-[#64748b] text-lg
              hover:bg-[#1a1a28] hover:border-[#1e1e2e] active:scale-95
              transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50
              flex items-center justify-center"
            aria-label="Backspace"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M8 5L3 10L8 15M3 10H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
