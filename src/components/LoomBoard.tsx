'use client';

import { useState } from 'react';
import type { Loom, Run, Job } from '@/types';
import LoomLane from './LoomLane';

interface LoomBoardProps {
  looms: Loom[];
  runs: Run[];
  selectedJob: Job | null;
  onRunClick: (run: Run) => void;
  onLoomCreated: () => void;
}

export default function LoomBoard({
  looms,
  runs,
  selectedJob,
  onRunClick,
  onLoomCreated,
}: LoomBoardProps) {
  const [showLoomForm, setShowLoomForm] = useState(false);
  const [loomLoading, setLoomLoading] = useState(false);
  const [loomForm, setLoomForm] = useState({
    name: '',
    loom_type: '',
    creel_type: '',
    usable_width_mm: '',
    nominal_speed: '',
  });

  async function handleCreateLoom(e: React.FormEvent) {
    e.preventDefault();
    setLoomLoading(true);
    try {
      const res = await fetch('/api/looms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: loomForm.name || null,
          loom_type: loomForm.loom_type || null,
          creel_type: loomForm.creel_type || null,
          usable_width_mm: loomForm.usable_width_mm ? parseInt(loomForm.usable_width_mm) : null,
          nominal_speed: loomForm.nominal_speed ? parseFloat(loomForm.nominal_speed) : null,
        }),
      });
      if (res.ok) {
        setLoomForm({ name: '', loom_type: '', creel_type: '', usable_width_mm: '', nominal_speed: '' });
        setShowLoomForm(false);
        onLoomCreated();
      }
    } finally {
      setLoomLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e1e2e]">
        <div>
          <h2 className="text-sm font-semibold text-[#e2e8f0] uppercase tracking-wider">Loom Planning Board</h2>
          <p className="text-xs text-[#64748b] mt-0.5">
            {looms.length} loom{looms.length !== 1 ? 's' : ''} · {runs.length} run{runs.length !== 1 ? 's' : ''} scheduled
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedJob && (
            <div className="text-xs bg-[#6366f1]/10 border border-[#6366f1]/30 text-[#818cf8] px-3 py-1.5 rounded-lg">
              Job {selectedJob.job_number} selected
            </div>
          )}
          <button
            onClick={() => setShowLoomForm(!showLoomForm)}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-150 focus:outline-none
              ${showLoomForm
                ? 'bg-[#1e1e2e] text-[#64748b]'
                : 'bg-[#12121a] border border-[#1e1e2e] text-[#94a3b8] hover:border-[#2d2d42] hover:text-[#e2e8f0]'
              }`}
          >
            {showLoomForm ? 'Cancel' : '+ Add Loom'}
          </button>
        </div>
      </div>

      {/* Add loom form */}
      {showLoomForm && (
        <div className="px-6 py-4 border-b border-[#1e1e2e] bg-[#12121a]">
          <form onSubmit={handleCreateLoom} className="grid grid-cols-5 gap-3 items-end">
            <input
              type="text"
              placeholder="Loom name"
              value={loomForm.name}
              onChange={(e) => setLoomForm({ ...loomForm, name: e.target.value })}
              className="px-3 py-2 text-sm bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg text-[#e2e8f0] placeholder-[#64748b] focus:outline-none focus:border-[#6366f1]/60"
            />
            <select
              value={loomForm.loom_type}
              onChange={(e) => setLoomForm({ ...loomForm, loom_type: e.target.value })}
              className="px-3 py-2 text-sm bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg text-[#e2e8f0] focus:outline-none focus:border-[#6366f1]/60"
            >
              <option value="">Type</option>
              <option>Axminster</option>
              <option>Gripper</option>
              <option>Wilton</option>
            </select>
            <select
              value={loomForm.creel_type}
              onChange={(e) => setLoomForm({ ...loomForm, creel_type: e.target.value })}
              className="px-3 py-2 text-sm bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg text-[#e2e8f0] focus:outline-none focus:border-[#6366f1]/60"
            >
              <option value="">Creel</option>
              <option>Smart</option>
              <option>Traditional</option>
            </select>
            <input
              type="number"
              placeholder="Width (mm)"
              value={loomForm.usable_width_mm}
              onChange={(e) => setLoomForm({ ...loomForm, usable_width_mm: e.target.value })}
              className="px-3 py-2 text-sm bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg text-[#e2e8f0] placeholder-[#64748b] focus:outline-none focus:border-[#6366f1]/60"
            />
            <button
              type="submit"
              disabled={loomLoading}
              className="py-2 text-sm font-medium bg-[#6366f1] hover:bg-[#5355cc] disabled:opacity-50 text-white rounded-lg transition-colors focus:outline-none"
            >
              {loomLoading ? 'Adding...' : 'Add'}
            </button>
          </form>
        </div>
      )}

      {/* Lanes */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        {looms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#12121a] border border-[#1e1e2e] flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="opacity-40">
                <rect x="2" y="8" width="24" height="3" rx="1.5" fill="#64748b" />
                <rect x="2" y="14" width="24" height="3" rx="1.5" fill="#64748b" />
                <rect x="2" y="20" width="24" height="3" rx="1.5" fill="#64748b" />
                <rect x="5" y="6" width="3" height="16" rx="1.5" fill="#94a3b8" />
                <rect x="20" y="6" width="3" height="16" rx="1.5" fill="#94a3b8" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-[#94a3b8]">No looms configured</p>
              <p className="text-xs text-[#64748b] mt-1">Click &quot;Add Loom&quot; to get started</p>
            </div>
          </div>
        ) : (
          looms.map((loom) => (
            <LoomLane
              key={loom.id}
              loom={loom}
              runs={runs}
              onRunClick={onRunClick}
            />
          ))
        )}
      </div>
    </div>
  );
}
