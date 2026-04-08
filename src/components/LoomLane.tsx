'use client';

import { useState } from 'react';
import type { Loom, Run, Job } from '@/types';
import RunBlock from './RunBlock';
import { calculateRemainingWidth } from '@/lib/planning/width';

interface LoomLaneProps {
  loom: Loom;
  runs: Run[];
  selectedJob: Job | null;
  onRunClick?: (run: Run) => void;
  onScheduled?: () => void;
}

export default function LoomLane({
  loom,
  runs,
  selectedJob,
  onRunClick,
  onScheduled,
}: LoomLaneProps) {
  const loomRuns = runs
    .filter((r) => r.loom_id === loom.id)
    .sort((a, b) => (a.start_time ?? '').localeCompare(b.start_time ?? ''));

  const loomWidth = loom.usable_width_mm ?? 0;
  const [scheduling, setScheduling] = useState(false);
  const [addingToRun, setAddingToRun] = useState<string | null>(null); // run id being added to

  // Can selected job fit as a new standalone run on this loom?
  const jobFits =
    selectedJob != null &&
    selectedJob.width_mm != null &&
    loomWidth > 0 &&
    selectedJob.width_mm <= loomWidth;

  const newRunWaste =
    jobFits && selectedJob?.width_mm != null
      ? loomWidth - selectedJob.width_mm
      : null;

  async function scheduleNewRun() {
    if (!selectedJob || !loom.id || !jobFits) return;
    setScheduling(true);
    try {
      const runRes = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loom_id: loom.id,
          waste_width_mm: newRunWaste,
          setup_minutes: null,
          start_time: null,
          end_time: null,
        }),
      });
      if (!runRes.ok) return;
      const run = await runRes.json();

      await fetch('/api/run-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          run_id: run.id,
          job_id: selectedJob.id,
          position: '0',
          width_mm: selectedJob.width_mm,
        }),
      });

      onScheduled?.();
    } finally {
      setScheduling(false);
    }
  }

  async function handleAddJobToRun(run: Run, job: Job) {
    if (!loomWidth) return;
    setAddingToRun(run.id);
    try {
      const existingItems = run.run_items ?? [];
      const newPosition = String(existingItems.length);
      const newWaste = calculateRemainingWidth(loomWidth, existingItems) - (job.width_mm ?? 0);

      // Insert run item
      await fetch('/api/run-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          run_id: run.id,
          job_id: job.id,
          position: newPosition,
          width_mm: job.width_mm,
        }),
      });

      // Update run waste
      await fetch(`/api/runs/${run.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ waste_width_mm: Math.max(0, newWaste) }),
      });

      onScheduled?.();
    } finally {
      setAddingToRun(null);
    }
  }

  return (
    <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-2 h-8 rounded-full bg-[#6366f1]" />
          <div>
            <h3 className="text-sm font-semibold text-[#e2e8f0]">{loom.name}</h3>
            <p className="text-xs text-[#64748b]">
              {loom.loom_type} · {loomWidth}mm · {loom.creel_type}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Schedule new run button */}
          {selectedJob && (
            <button
              onClick={scheduleNewRun}
              disabled={!jobFits || scheduling}
              title={
                !jobFits
                  ? `Job (${selectedJob.width_mm}mm) exceeds loom width (${loomWidth}mm)`
                  : `New run · ${newRunWaste}mm waste`
              }
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-150 focus:outline-none
                ${jobFits
                  ? 'bg-[#6366f1]/15 border border-[#6366f1]/40 text-[#818cf8] hover:bg-[#6366f1]/25 hover:border-[#6366f1]/60'
                  : 'bg-[#1e1e2e] border border-[#2d2d42] text-[#374151] cursor-not-allowed'
                }`}
            >
              {scheduling ? (
                <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              )}
              {scheduling ? 'Scheduling…' : 'New run'}
            </button>
          )}

          <div className="text-xs text-[#64748b] text-right">
            <div className="text-[#94a3b8] font-medium">{loom.nominal_speed}m/h</div>
            <div>{loomRuns.length} run{loomRuns.length !== 1 ? 's' : ''}</div>
          </div>
        </div>
      </div>

      {/* Width preview for new run when job is selected */}
      {selectedJob && jobFits && newRunWaste !== null && (
        <div className="mb-3 px-1">
          <div className="h-2 rounded-full bg-[#0a0a0f] overflow-hidden flex">
            <div
              className="bg-[#6366f1]/60 h-full rounded-l-full"
              style={{ width: `${((selectedJob.width_mm ?? 0) / loomWidth) * 100}%` }}
            />
            <div className="bg-[#0d0d15] h-full flex-1 rounded-r-full border-l border-dashed border-[#2d2d42]" />
          </div>
          <p className="text-[10px] text-[#64748b] mt-1">
            New run · {selectedJob.width_mm}mm job · {newRunWaste}mm waste
            {loomRuns.some((r) =>
              calculateRemainingWidth(loomWidth, r.run_items ?? []) >= (selectedJob.width_mm ?? 0)
            ) && (
              <span className="text-[#6366f1]/70 ml-1">· or hover a run below to add</span>
            )}
          </p>
        </div>
      )}

      {selectedJob && !jobFits && loomWidth > 0 && selectedJob.width_mm != null && (
        <div className="mb-3 px-1">
          <p className="text-[10px] text-[#ef4444]/70">
            Job too wide — {selectedJob.width_mm}mm &gt; {loomWidth}mm loom width
          </p>
        </div>
      )}

      {/* Runs */}
      <div className="flex flex-col gap-2">
        {loomRuns.length === 0 ? (
          <div className="h-12 border border-dashed border-[#2d2d42] rounded-lg flex items-center justify-center">
            <span className="text-xs text-[#64748b]">No runs scheduled</span>
          </div>
        ) : (
          loomRuns.map((run) => (
            <div key={run.id} className="relative">
              {addingToRun === run.id && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-[#0a0a0f]/60">
                  <span className="w-4 h-4 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <RunBlock
                run={run}
                loomWidth={loomWidth || 5000}
                selectedJob={selectedJob}
                onClick={() => onRunClick?.(run)}
                onAddJob={handleAddJobToRun}
              />
              {run.setup_minutes != null && (
                <p className="text-[10px] text-[#64748b] mt-1 ml-1">
                  Setup: {run.setup_minutes}min
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
