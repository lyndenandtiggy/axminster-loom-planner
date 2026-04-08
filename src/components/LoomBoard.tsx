'use client';

import { useState } from 'react';
import type { Loom, Run, Job } from '@/types';
import LoomLane from './LoomLane';
import { findBestPairing } from '@/lib/planning/pairing';
import { calculateWidthAllocation } from '@/lib/planning/width';

interface ProposedRun {
  loom: Loom;
  job1: Job;
  job2: Job | null;
  waste: number;
}

interface LoomBoardProps {
  looms: Loom[];
  runs: Run[];
  jobs: Job[];
  selectedJob: Job | null;
  onRunClick: (run: Run) => void;
  onLoomCreated: () => void;
  onRunCreated: () => void;
}

export default function LoomBoard({
  looms,
  runs,
  jobs,
  selectedJob,
  onRunClick,
  onLoomCreated,
  onRunCreated,
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

  const [proposing, setProposing] = useState(false);
  const [proposal, setProposal] = useState<ProposedRun[] | null>(null);
  const [applying, setApplying] = useState(false);

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

  function buildProposal() {
    const pendingJobs = jobs.filter((j) => j.status === 'pending' || !j.status);
    if (pendingJobs.length === 0 || looms.length === 0) return;

    setProposing(true);
    const proposed: ProposedRun[] = [];
    const usedJobIds = new Set<string>();

    // Distribute jobs across looms using best-pairing per loom
    for (const loom of looms) {
      const available = pendingJobs.filter((j) => !usedJobIds.has(j.id));
      if (available.length === 0) break;

      const pairs = findBestPairing(available, loom);
      for (const [job1, job2] of pairs) {
        if (usedJobIds.has(job1.id)) continue;
        const alloc = calculateWidthAllocation(
          loom.usable_width_mm ?? 5000,
          job1.width_mm ?? 0,
          job2?.width_mm ?? undefined
        );
        if (!alloc.fits) continue;

        proposed.push({ loom, job1, job2, waste: alloc.waste });
        usedJobIds.add(job1.id);
        if (job2) usedJobIds.add(job2.id);
      }
    }

    setProposal(proposed);
    setProposing(false);
  }

  async function applyProposal() {
    if (!proposal) return;
    setApplying(true);
    try {
      for (const p of proposal) {
        const runRes = await fetch('/api/runs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            loom_id: p.loom.id,
            waste_width_mm: p.waste,
            setup_minutes: null,
            start_time: null,
            end_time: null,
          }),
        });
        if (!runRes.ok) continue;
        const run = await runRes.json();

        await fetch('/api/run-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            run_id: run.id,
            job_id: p.job1.id,
            position: 'left',
            width_mm: p.job1.width_mm,
          }),
        });

        if (p.job2) {
          await fetch('/api/run-items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              run_id: run.id,
              job_id: p.job2.id,
              position: 'right',
              width_mm: p.job2.width_mm,
            }),
          });
        }
      }

      setProposal(null);
      onRunCreated();
    } finally {
      setApplying(false);
    }
  }

  const pendingCount = jobs.filter((j) => j.status === 'pending' || !j.status).length;

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
              Job {selectedJob.job_number} selected — click a lane to schedule
            </div>
          )}

          {/* Propose Planning button */}
          {pendingCount > 0 && looms.length > 0 && !selectedJob && (
            <button
              onClick={buildProposal}
              disabled={proposing}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-150 focus:outline-none bg-[#6366f1] hover:bg-[#5355cc] text-white disabled:opacity-60"
            >
              {proposing ? (
                <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M1 5.5h9M5.5 1l4.5 4.5L5.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              Propose Planning
            </button>
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

      {/* Proposal modal */}
      {proposal && (
        <div className="mx-6 mt-4 mb-0 bg-[#12121a] border border-[#6366f1]/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-[#e2e8f0]">Proposed Schedule</h3>
              <p className="text-xs text-[#64748b] mt-0.5">{proposal.length} run{proposal.length !== 1 ? 's' : ''} across {new Set(proposal.map(p => p.loom.id)).size} loom{new Set(proposal.map(p => p.loom.id)).size !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setProposal(null)}
                className="text-xs text-[#64748b] hover:text-[#94a3b8] focus:outline-none"
              >
                Dismiss
              </button>
              <button
                onClick={applyProposal}
                disabled={applying}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-[#10b981] hover:bg-[#059669] text-white transition-colors focus:outline-none disabled:opacity-60"
              >
                {applying ? (
                  <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {applying ? 'Applying…' : 'Apply Plan'}
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {proposal.map((p, i) => (
              <div key={i} className="flex items-center gap-3 bg-[#0a0a0f] rounded-lg px-3 py-2">
                <div className="text-xs font-medium text-[#94a3b8] w-24 truncate">{p.loom.name}</div>
                <div className="flex-1 h-4 rounded bg-[#12121a] overflow-hidden flex">
                  <div
                    className="bg-[#6366f1]/70 h-full"
                    style={{ width: `${((p.job1.width_mm ?? 0) / (p.loom.usable_width_mm ?? 1)) * 100}%` }}
                    title={p.job1.job_number ?? ''}
                  />
                  {p.job2 && (
                    <div
                      className="bg-[#10b981]/70 h-full"
                      style={{ width: `${((p.job2.width_mm ?? 0) / (p.loom.usable_width_mm ?? 1)) * 100}%` }}
                      title={p.job2.job_number ?? ''}
                    />
                  )}
                  <div className="bg-[#1e1e2e] h-full flex-1" />
                </div>
                <div className="text-[10px] text-[#64748b] w-28 text-right truncate">
                  {p.job1.job_number}{p.job2 ? ` + ${p.job2.job_number}` : ''} · {p.waste}mm waste
                </div>
              </div>
            ))}
            {proposal.length === 0 && (
              <p className="text-xs text-[#64748b] text-center py-2">No valid pairings found for pending jobs</p>
            )}
          </div>
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
              selectedJob={selectedJob}
              onRunClick={onRunClick}
              onScheduled={onRunCreated}
            />
          ))
        )}
      </div>
    </div>
  );
}
