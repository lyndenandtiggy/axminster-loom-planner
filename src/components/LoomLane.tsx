'use client';

import { useState } from 'react';
import type { Loom, Run, Job } from '@/types';
import RunBlock from './RunBlock';
import { calculateWidthAllocation } from '@/lib/planning/width';

interface LoomLaneProps {
  loom: Loom;
  runs: Run[];
  selectedJob: Job | null;
  onRunClick?: (run: Run) => void;
  onScheduled?: () => void;
}

export default function LoomLane({ loom, runs, selectedJob, onRunClick, onScheduled }: LoomLaneProps) {
  const loomRuns = runs.filter((r) => r.loom_id === loom.id);
  const [scheduling, setScheduling] = useState(false);

  const jobFits =
    selectedJob && loom.usable_width_mm && selectedJob.width_mm
      ? selectedJob.width_mm <= loom.usable_width_mm
      : false;

  const allocation =
    selectedJob && loom.usable_width_mm && selectedJob.width_mm
      ? calculateWidthAllocation(loom.usable_width_mm, selectedJob.width_mm)
      : null;

  async function handleSchedule() {
    if (!selectedJob || !loom.id) return;
    setScheduling(true);
    try {
      // Create the run
      const runRes = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loom_id: loom.id,
          waste_width_mm: allocation?.waste ?? null,
          setup_minutes: null,
          start_time: null,
          end_time: null,
        }),
      });
      if (!runRes.ok) return;
      const run = await runRes.json();

      // Create the run item
      await fetch('/api/run-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          run_id: run.id,
          job_id: selectedJob.id,
          position: 'left',
          width_mm: selectedJob.width_mm,
        }),
      });

      onScheduled?.();
    } finally {
      setScheduling(false);
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
              {loom.loom_type} · {loom.usable_width_mm}mm · {loom.creel_type}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Schedule button — shown when a job is selected */}
          {selectedJob && (
            <button
              onClick={handleSchedule}
              disabled={!jobFits || scheduling}
              title={!jobFits ? `Job (${selectedJob.width_mm}mm) exceeds loom width (${loom.usable_width_mm}mm)` : undefined}
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
              {scheduling ? 'Scheduling…' : 'Schedule here'}
            </button>
          )}
          <div className="text-xs text-[#64748b] text-right">
            <div className="text-[#94a3b8] font-medium">{loom.nominal_speed}m/h</div>
            <div>{loomRuns.length} run{loomRuns.length !== 1 ? 's' : ''}</div>
          </div>
        </div>
      </div>

      {/* Width preview when job selected and fits */}
      {selectedJob && jobFits && allocation && (
        <div className="mb-3 px-1">
          <div className="h-2 rounded-full bg-[#0a0a0f] overflow-hidden flex gap-px">
            <div
              className="bg-[#6366f1]/70 h-full rounded-full"
              style={{ width: `${((selectedJob.width_mm ?? 0) / (loom.usable_width_mm ?? 1)) * 100}%` }}
            />
            <div className="bg-[#1e1e2e] h-full flex-1 rounded-full" />
          </div>
          <p className="text-[10px] text-[#64748b] mt-1">
            {selectedJob.width_mm}mm job · {allocation.waste}mm waste ({((allocation.waste / (loom.usable_width_mm ?? 1)) * 100).toFixed(0)}%)
          </p>
        </div>
      )}

      {selectedJob && !jobFits && loom.usable_width_mm && selectedJob.width_mm && (
        <div className="mb-3 px-1">
          <p className="text-[10px] text-[#ef4444]/70">
            Job too wide — {selectedJob.width_mm}mm &gt; {loom.usable_width_mm}mm loom width
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
            <div key={run.id}>
              <RunBlock
                run={run}
                loomWidth={loom.usable_width_mm || 5000}
                onClick={() => onRunClick?.(run)}
              />
              {run.setup_minutes && (
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
