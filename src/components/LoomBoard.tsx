'use client';

import { useState } from 'react';
import type { Loom, Run, Job } from '@/types';
import LoomLane from './LoomLane';
import { packJobsForLoom } from '@/lib/planning/pairing';
import { calculateMultiJobAllocation } from '@/lib/planning/width';
import { DEFAULT_PREFERRED_MAX_SPLIT } from '@/lib/planning/scoring';

interface ProposedRun {
  loom: Loom;
  jobs: Job[];
  waste: number;
  totalAllocated: number;
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

    const proposed: ProposedRun[] = [];
    const usedJobIds = new Set<string>();

    for (const loom of looms) {
      const available = pendingJobs.filter((j) => !usedJobIds.has(j.id));
      if (available.length === 0) break;

      const runGroups = packJobsForLoom(available, loom);

      for (const group of runGroups) {
        const alloc = calculateMultiJobAllocation(
          loom.usable_width_mm ?? 0,
          group.map((j) => j.width_mm ?? 0)
        );
        if (!alloc.fits) continue;

        proposed.push({ loom, jobs: group, waste: alloc.waste, totalAllocated: alloc.totalAllocated });
        for (const j of group) usedJobIds.add(j.id);
      }
    }

    setProposal(proposed);
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

        for (let i = 0; i < p.jobs.length; i++) {
          const job = p.jobs[i];
          await fetch('/api/run-items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              run_id: run.id,
              job_id: job.id,
              position: String(i),
              width_mm: job.width_mm,
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
              {selectedJob.job_number} selected — click a lane or hover a run
            </div>
          )}

          {pendingCount > 0 && looms.length > 0 && !selectedJob && (
            <button
              onClick={buildProposal}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-150 focus:outline-none bg-[#6366f1] hover:bg-[#5355cc] text-white"
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M1 5.5h9M5.5 1l4.5 4.5L5.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
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

      {/* Proposal panel */}
      {proposal && (
        <div className="mx-6 mt-4 mb-0 bg-[#12121a] border border-[#6366f1]/30 rounded-xl p-4 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-[#e2e8f0]">Proposed Schedule</h3>
              <p className="text-xs text-[#64748b] mt-0.5">
                {proposal.length} run{proposal.length !== 1 ? 's' : ''} · {proposal.reduce((s, p) => s + p.jobs.length, 0)} jobs
              </p>
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

          <div className="flex flex-col gap-2 max-h-52 overflow-y-auto">
            {proposal.length === 0 && (
              <p className="text-xs text-[#64748b] text-center py-2">No valid runs found for pending jobs and available looms</p>
            )}
            {proposal.map((p, i) => {
              const loomW = p.loom.usable_width_mm ?? 1;
              const splitWarning = p.jobs.length > DEFAULT_PREFERRED_MAX_SPLIT;
              return (
                <div key={i} className="flex items-center gap-3 bg-[#0a0a0f] rounded-lg px-3 py-2">
                  <div className="text-xs font-medium text-[#94a3b8] w-20 truncate shrink-0">{p.loom.name}</div>
                  {/* Width bar */}
                  <div className="flex-1 h-5 rounded-md bg-[#12121a] overflow-hidden flex border border-[#1e1e2e]">
                    {p.jobs.map((job, ji) => {
                      const COLOURS = ['bg-[#6366f1]/50', 'bg-[#10b981]/50', 'bg-[#f59e0b]/50', 'bg-[#ec4899]/50', 'bg-[#06b6d4]/50'];
                      return (
                        <div
                          key={job.id}
                          className={`${COLOURS[ji % COLOURS.length]} h-full flex items-center justify-center border-r border-[#1e1e2e] last:border-r-0 shrink-0`}
                          style={{ width: `${((job.width_mm ?? 0) / loomW) * 100}%` }}
                          title={job.job_number ?? ''}
                        >
                          {((job.width_mm ?? 0) / loomW) > 0.08 && (
                            <span className="text-[9px] text-[#e2e8f0] truncate px-0.5">{job.job_number}</span>
                          )}
                        </div>
                      );
                    })}
                    {p.waste > 0 && (
                      <div
                        className="bg-[#0d0d15] h-full flex-1"
                        title={`Waste: ${p.waste}mm`}
                      />
                    )}
                  </div>
                  <div className="text-[10px] text-right shrink-0 w-32">
                    <span className="text-[#64748b]">{p.jobs.length} job{p.jobs.length !== 1 ? 's' : ''} · {p.waste}mm waste</span>
                    {splitWarning && (
                      <span className="ml-1 text-[#f59e0b]">⚠</span>
                    )}
                  </div>
                </div>
              );
            })}
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
