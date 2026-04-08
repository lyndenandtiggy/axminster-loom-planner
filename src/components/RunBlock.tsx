'use client';

import type { Run, Job } from '@/types';
import { calculateRemainingWidth } from '@/lib/planning/width';
import { DEFAULT_PREFERRED_MAX_SPLIT } from '@/lib/planning/scoring';

const JOB_COLOURS = [
  'bg-[#6366f1]/40 border-[#6366f1]/20',
  'bg-[#10b981]/40 border-[#10b981]/20',
  'bg-[#f59e0b]/40 border-[#f59e0b]/20',
  'bg-[#ec4899]/40 border-[#ec4899]/20',
  'bg-[#06b6d4]/40 border-[#06b6d4]/20',
];

interface RunBlockProps {
  run: Run;
  loomWidth: number;
  /** When set, shows an "Add to run" overlay if the job fits. */
  selectedJob?: Job | null;
  onClick?: () => void;
  onAddJob?: (run: Run, job: Job) => void;
}

export default function RunBlock({
  run,
  loomWidth,
  selectedJob,
  onClick,
  onAddJob,
}: RunBlockProps) {
  const items = (run.run_items ?? []).slice().sort((a, b) => {
    // Sort by position (stored as "0","1","2"...) then by insertion order
    const ai = parseInt(a.position ?? '0', 10);
    const bi = parseInt(b.position ?? '0', 10);
    return ai - bi;
  });

  const totalAllocated = items.reduce((sum, i) => sum + (i.width_mm ?? 0), 0);
  const remainingWidth = Math.max(0, loomWidth - totalAllocated);
  const wastePercent = loomWidth > 0 ? (remainingWidth / loomWidth) * 100 : 0;

  const splitWarning = items.length >= DEFAULT_PREFERRED_MAX_SPLIT;

  const canAdd =
    selectedJob &&
    selectedJob.width_mm != null &&
    selectedJob.width_mm > 0 &&
    selectedJob.width_mm <= calculateRemainingWidth(loomWidth, items) &&
    !items.some((i) => i.job_id === selectedJob.id);

  function handleAddClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (canAdd && selectedJob && onAddJob) {
      onAddJob(run, selectedJob);
    }
  }

  return (
    <div className="group relative">
      <button
        onClick={onClick}
        className={`flex h-12 w-full rounded-lg overflow-hidden border transition-all duration-150 focus:outline-none
          ${splitWarning
            ? 'border-[#f59e0b]/30 hover:border-[#f59e0b]/60'
            : 'border-[#2d2d42] hover:border-[#6366f1]/50'
          }`}
      >
        {/* Job segments */}
        {items.map((item, i) => {
          const widthPct =
            loomWidth > 0 && item.width_mm ? (item.width_mm / loomWidth) * 100 : 0;
          return (
            <div
              key={item.id}
              className={`${JOB_COLOURS[i % JOB_COLOURS.length]} flex items-center justify-center px-1.5 border-r border-[#1e1e2e] last:border-r-0 shrink-0`}
              style={{ width: `${widthPct}%` }}
              title={`${item.job?.job_number ?? 'Job'} — ${item.width_mm ?? 0}mm`}
            >
              <span className="text-[10px] font-medium text-[#e2e8f0] truncate leading-none">
                {item.job?.job_number ?? '—'}
              </span>
            </div>
          );
        })}

        {/* Waste segment */}
        {remainingWidth > 0 && loomWidth > 0 && (
          <div
            className="flex items-center justify-center bg-[#0d0d15] border-l border-dashed border-[#2d2d42]"
            style={{ width: `${wastePercent}%` }}
            title={`Waste: ${remainingWidth}mm (${wastePercent.toFixed(0)}%)`}
          >
            {wastePercent > 8 && (
              <span className="text-[9px] text-[#374151] font-medium">
                {remainingWidth}mm
              </span>
            )}
          </div>
        )}

        {items.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-[10px] text-[#64748b]">Empty run</span>
          </div>
        )}
      </button>

      {/* Split-count warning pip */}
      {splitWarning && (
        <div
          className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#f59e0b]"
          title={`${items.length} jobs in this run (preferred max: ${DEFAULT_PREFERRED_MAX_SPLIT})`}
        />
      )}

      {/* Add-to-run overlay — shown when a compatible job is selected */}
      {canAdd && (
        <button
          onClick={handleAddClick}
          className="absolute inset-0 flex items-center justify-center rounded-lg bg-[#6366f1]/10 border-2 border-dashed border-[#6366f1]/50 opacity-0 group-hover:opacity-100 transition-opacity duration-150 focus:outline-none"
          title={`Add ${selectedJob?.job_number} to this run`}
        >
          <span className="flex items-center gap-1 text-[10px] font-semibold text-[#818cf8] bg-[#0a0a0f]/80 px-2 py-1 rounded-md">
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
              <path d="M4.5 1v7M1 4.5h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Add {selectedJob?.job_number}
          </span>
        </button>
      )}
    </div>
  );
}
