'use client';

import type { Job, Run, Loom } from '@/types';
import { calculateWidthAllocation, calculateRemainingWidth } from '@/lib/planning/width';
import { findBestPairing } from '@/lib/planning/pairing';
import { scoreRun, DEFAULT_PREFERRED_MAX_SPLIT } from '@/lib/planning/scoring';

interface DetailsPanelProps {
  selectedJob: Job | null;
  selectedRun: Run | null;
  jobs: Job[];
  looms: Loom[];
}

export default function DetailsPanel({
  selectedJob,
  selectedRun,
  jobs,
  looms,
}: DetailsPanelProps) {
  // Pairing analysis for selected job across all looms
  const pairingAnalysis = selectedJob
    ? looms.map((loom) => {
        const otherJobs = jobs.filter(
          (j) => j.id !== selectedJob.id && (j.status === 'pending' || !j.status)
        );
        const pairs = findBestPairing([selectedJob, ...otherJobs], loom);
        const myPair = pairs.find(([j]) => j.id === selectedJob.id);
        if (!myPair) return null;

        const [, partner] = myPair;
        const allocation =
          loom.usable_width_mm && selectedJob.width_mm
            ? calculateWidthAllocation(
                loom.usable_width_mm,
                selectedJob.width_mm,
                partner?.width_mm ?? undefined
              )
            : null;

        return { loom, partner, allocation };
      }).filter(Boolean)
    : [];

  // Run score for selected run
  const items = selectedRun?.run_items ?? [];
  const loomWidth = selectedRun?.loom?.usable_width_mm ?? 0;
  const remainingWidth = loomWidth > 0 ? calculateRemainingWidth(loomWidth, items) : 0;
  const highestPriority = items.reduce((min, i) => {
    const p = i.job?.priority ?? 5;
    return p < min ? p : min;
  }, 5);
  const jobCount = items.length;

  const runScoreResult =
    selectedRun && loomWidth > 0
      ? scoreRun({
          wasteWidth: remainingWidth,
          loomWidth,
          setupMinutes: selectedRun.setup_minutes ?? 0,
          highestPriority,
          jobCount,
          preferredMaxSplit: DEFAULT_PREFERRED_MAX_SPLIT,
        })
      : null;

  const changeoverColour =
    runScoreResult?.changeoverClass === 'low'
      ? 'text-[#10b981]'
      : runScoreResult?.changeoverClass === 'medium'
      ? 'text-[#f59e0b]'
      : runScoreResult?.changeoverClass === 'high'
      ? 'text-[#ef4444]'
      : 'text-[#64748b]';

  if (!selectedJob && !selectedRun) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-[#1e1e2e]">
          <h2 className="text-sm font-semibold text-[#e2e8f0] uppercase tracking-wider">Details</h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6">
          <div className="w-12 h-12 rounded-xl bg-[#12121a] border border-[#1e1e2e] flex items-center justify-center opacity-50">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="#64748b" strokeWidth="1.5" />
              <path d="M10 6V10L13 13" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-xs text-[#64748b] text-center">
            Select a job or run to view details and planning analysis
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-[#1e1e2e]">
        <h2 className="text-sm font-semibold text-[#e2e8f0] uppercase tracking-wider">Details</h2>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* Selected job */}
        {selectedJob && (
          <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-4">
            <h3 className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-3">Selected Job</h3>
            <div className="flex flex-col gap-2">
              <Row label="Job #" value={selectedJob.job_number} />
              <Row label="Customer" value={selectedJob.customer} truncate />
              <Row label="Weave Type" value={selectedJob.weave_type} />
              <Row label="Width" value={selectedJob.width_mm != null ? `${selectedJob.width_mm}mm` : null} />
              <Row label="Length" value={selectedJob.length_m != null ? `${selectedJob.length_m}m` : null} />
              <Row
                label="Due Date"
                value={selectedJob.due_date ? new Date(selectedJob.due_date).toLocaleDateString('en-GB') : null}
              />
              <div className="flex justify-between">
                <span className="text-xs text-[#64748b]">Priority</span>
                <span className={`text-xs font-bold ${
                  (selectedJob.priority ?? 3) <= 2 ? 'text-[#ef4444]'
                  : (selectedJob.priority ?? 3) <= 4 ? 'text-[#f59e0b]'
                  : 'text-[#64748b]'
                }`}>
                  P{selectedJob.priority ?? '—'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Pairing analysis */}
        {selectedJob && pairingAnalysis.length > 0 && (
          <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-4">
            <h3 className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-3">Loom Fit Analysis</h3>
            <div className="flex flex-col gap-3">
              {pairingAnalysis.map((analysis) => {
                if (!analysis) return null;
                const { loom, partner, allocation } = analysis;
                return (
                  <div key={loom.id} className="border border-[#1e1e2e] rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium text-[#94a3b8]">{loom.name}</span>
                      {allocation && (
                        <span className={`text-[10px] font-medium ${allocation.fits ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                          {allocation.fits ? 'FITS' : 'TOO WIDE'}
                        </span>
                      )}
                    </div>
                    {partner ? (
                      <div className="text-xs text-[#64748b]">
                        <p>Best pair: <span className="text-[#94a3b8]">{partner.job_number}</span></p>
                        {allocation && (
                          <>
                            <p>Waste: <span className={allocation.waste > 500 ? 'text-[#f59e0b]' : 'text-[#10b981]'}>{allocation.waste}mm</span></p>
                            <div className="mt-2 h-3 rounded bg-[#0a0a0f] overflow-hidden flex">
                              <div
                                className="bg-[#6366f1]/60 h-full"
                                style={{ width: `${((selectedJob.width_mm ?? 0) / (loom.usable_width_mm ?? 1)) * 100}%` }}
                                title={selectedJob.job_number ?? ''}
                              />
                              <div
                                className="bg-[#10b981]/60 h-full"
                                style={{ width: `${((partner.width_mm ?? 0) / (loom.usable_width_mm ?? 1)) * 100}%` }}
                                title={partner.job_number ?? ''}
                              />
                              <div className="bg-[#1e1e2e] h-full flex-1" />
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-[#64748b]">No pairable job found — runs solo</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected run details */}
        {selectedRun && (
          <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-4">
            <h3 className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-3">Selected Run</h3>
            <div className="flex flex-col gap-2">
              {selectedRun.loom && <Row label="Loom" value={selectedRun.loom.name} />}
              <Row label="Jobs in run" value={String(jobCount)} />
              <div className="flex justify-between">
                <span className="text-xs text-[#64748b]">Waste</span>
                <span className="text-xs font-medium text-[#f59e0b]">
                  {loomWidth > 0 ? `${remainingWidth}mm (${((remainingWidth / loomWidth) * 100).toFixed(0)}%)` : '—'}
                </span>
              </div>
              {loomWidth > 0 && (
                <div className="h-2 rounded-full bg-[#0a0a0f] overflow-hidden flex">
                  <div
                    className="bg-[#6366f1]/50 h-full rounded-l-full"
                    style={{ width: `${((loomWidth - remainingWidth) / loomWidth) * 100}%` }}
                  />
                  <div className="bg-[#0d0d15] h-full flex-1 rounded-r-full border-l border-dashed border-[#2d2d42]" />
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-xs text-[#64748b]">Setup time</span>
                <span className={`text-xs font-medium ${changeoverColour}`}>
                  {selectedRun.setup_minutes != null ? `${selectedRun.setup_minutes}min` : '—'}
                  {runScoreResult?.changeoverClass && ` (${runScoreResult.changeoverClass})`}
                </span>
              </div>
              {runScoreResult != null && (
                <div className="flex justify-between">
                  <span className="text-xs text-[#64748b]">Run score</span>
                  <span className={`text-xs font-bold ${
                    runScoreResult.score >= 70 ? 'text-[#10b981]'
                    : runScoreResult.score >= 40 ? 'text-[#f59e0b]'
                    : 'text-[#ef4444]'
                  }`}>
                    {runScoreResult.score.toFixed(0)}/100
                  </span>
                </div>
              )}
              {runScoreResult?.splitWarning && (
                <div className="flex items-start gap-1.5 bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-lg px-3 py-2 mt-1">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0 mt-0.5">
                    <path d="M6 1L11 10H1L6 1Z" stroke="#f59e0b" strokeWidth="1.2" strokeLinejoin="round" />
                    <path d="M6 5v2M6 8.5v.5" stroke="#f59e0b" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  <p className="text-[10px] text-[#f59e0b]">
                    {jobCount} jobs in one run (preferred max: {DEFAULT_PREFERRED_MAX_SPLIT}). Operationally complex but not blocked.
                  </p>
                </div>
              )}

              {/* Jobs in run */}
              {items.length > 0 && (
                <div className="mt-2 pt-2 border-t border-[#1e1e2e]">
                  <p className="text-[10px] text-[#64748b] mb-2">Jobs in run:</p>
                  {items.map((item, i) => {
                    const COLOURS = ['text-[#818cf8]', 'text-[#34d399]', 'text-[#fbbf24]', 'text-[#f472b6]', 'text-[#22d3ee]'];
                    return (
                      <div key={item.id} className="flex justify-between text-xs py-1">
                        <span className={COLOURS[i % COLOURS.length]}>{item.job?.job_number ?? '—'}</span>
                        <span className="text-[#64748b]">{item.width_mm}mm</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  truncate,
}: {
  label: string;
  value: string | null | undefined;
  truncate?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-xs text-[#64748b]">{label}</span>
      <span className={`text-xs font-medium text-[#e2e8f0] ${truncate ? 'max-w-[140px] truncate text-right' : ''}`}>
        {value ?? '—'}
      </span>
    </div>
  );
}
