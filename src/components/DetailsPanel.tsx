'use client';

import type { Job, Run, Loom } from '@/types';
import { calculateWidthAllocation } from '@/lib/planning/width';
import { findBestPairing } from '@/lib/planning/pairing';
import { classifyChangeover } from '@/lib/planning/changeover';
import { scoreRun } from '@/lib/planning/scoring';

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
  // Find best pairing for selected job
  const pairingAnalysis = selectedJob
    ? looms.map((loom) => {
        const otherJobs = jobs.filter(
          (j) => j.id !== selectedJob.id && j.status === 'pending'
        );
        const pairs = findBestPairing([selectedJob, ...otherJobs], loom);
        const myPair = pairs.find(([j]) => j.id === selectedJob.id);
        if (!myPair) return null;

        const [, partner] = myPair;
        const allocation = loom.usable_width_mm && selectedJob.width_mm
          ? calculateWidthAllocation(
              loom.usable_width_mm,
              selectedJob.width_mm,
              partner?.width_mm ?? undefined
            )
          : null;

        return { loom, partner, allocation };
      }).filter(Boolean)
    : [];

  // Run score
  const runScore = selectedRun && selectedRun.loom
    ? scoreRun({
        wasteWidth: selectedRun.waste_width_mm || 0,
        loomWidth: selectedRun.loom.usable_width_mm || 5000,
        setupMinutes: selectedRun.setup_minutes || 0,
        priority: selectedRun.run_items?.[0]?.job?.priority || 3,
      })
    : null;

  const changeoverClass = selectedRun?.setup_minutes
    ? classifyChangeover(selectedRun.setup_minutes)
    : null;

  const changeoverColour =
    changeoverClass === 'low'
      ? 'text-[#10b981]'
      : changeoverClass === 'medium'
      ? 'text-[#f59e0b]'
      : changeoverClass === 'high'
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
        {/* Selected job details */}
        {selectedJob && (
          <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-4">
            <h3 className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-3">Selected Job</h3>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-xs text-[#64748b]">Job #</span>
                <span className="text-xs font-medium text-[#e2e8f0]">{selectedJob.job_number || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-[#64748b]">Customer</span>
                <span className="text-xs font-medium text-[#e2e8f0] text-right max-w-[140px] truncate">{selectedJob.customer || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-[#64748b]">Weave Type</span>
                <span className="text-xs font-medium text-[#e2e8f0]">{selectedJob.weave_type || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-[#64748b]">Width</span>
                <span className="text-xs font-medium text-[#e2e8f0]">{selectedJob.width_mm ? `${selectedJob.width_mm}mm` : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-[#64748b]">Length</span>
                <span className="text-xs font-medium text-[#e2e8f0]">{selectedJob.length_m ? `${selectedJob.length_m}m` : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-[#64748b]">Due Date</span>
                <span className="text-xs font-medium text-[#e2e8f0]">
                  {selectedJob.due_date ? new Date(selectedJob.due_date).toLocaleDateString('en-GB') : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-[#64748b]">Priority</span>
                <span className={`text-xs font-bold ${
                  (selectedJob.priority || 3) <= 2 ? 'text-[#ef4444]'
                  : (selectedJob.priority || 3) <= 4 ? 'text-[#f59e0b]'
                  : 'text-[#64748b]'
                }`}>
                  P{selectedJob.priority || '—'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Pairing analysis */}
        {selectedJob && pairingAnalysis.length > 0 && (
          <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-4">
            <h3 className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-3">Pairing Analysis</h3>
            <div className="flex flex-col gap-3">
              {pairingAnalysis.map((analysis) => {
                if (!analysis) return null;
                const { loom, partner, allocation } = analysis;
                return (
                  <div key={loom.id} className="border border-[#1e1e2e] rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium text-[#94a3b8]">{loom.name}</span>
                      {allocation && (
                        <span className={`text-[10px] font-medium ${
                          allocation.fits ? 'text-[#10b981]' : 'text-[#ef4444]'
                        }`}>
                          {allocation.fits ? 'FITS' : 'NO FIT'}
                        </span>
                      )}
                    </div>
                    {partner ? (
                      <div className="text-xs text-[#64748b]">
                        <p>Pair with: <span className="text-[#94a3b8]">{partner.job_number}</span></p>
                        {allocation && (
                          <>
                            <p>Waste: <span className={allocation.waste > 500 ? 'text-[#f59e0b]' : 'text-[#10b981]'}>{allocation.waste}mm</span></p>
                            <div className="mt-2 h-3 rounded bg-[#0a0a0f] overflow-hidden flex">
                              <div
                                className="bg-[#6366f1]/60 h-full"
                                style={{ width: `${((selectedJob.width_mm || 0) / (loom.usable_width_mm || 1)) * 100}%` }}
                              />
                              <div
                                className="bg-[#10b981]/60 h-full"
                                style={{ width: `${((partner.width_mm || 0) / (loom.usable_width_mm || 1)) * 100}%` }}
                              />
                              <div className="bg-[#1e1e2e] h-full flex-1" />
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-[#64748b]">No suitable pair found</p>
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
              {selectedRun.loom && (
                <div className="flex justify-between">
                  <span className="text-xs text-[#64748b]">Loom</span>
                  <span className="text-xs font-medium text-[#e2e8f0]">{selectedRun.loom.name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-xs text-[#64748b]">Waste</span>
                <span className="text-xs font-medium text-[#f59e0b]">
                  {selectedRun.waste_width_mm ? `${selectedRun.waste_width_mm}mm` : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-[#64748b]">Setup time</span>
                <span className={`text-xs font-medium ${changeoverColour}`}>
                  {selectedRun.setup_minutes ? `${selectedRun.setup_minutes}min` : '—'}
                  {changeoverClass && ` (${changeoverClass})`}
                </span>
              </div>
              {runScore !== null && (
                <div className="flex justify-between">
                  <span className="text-xs text-[#64748b]">Run score</span>
                  <span className={`text-xs font-bold ${
                    runScore >= 70 ? 'text-[#10b981]'
                    : runScore >= 40 ? 'text-[#f59e0b]'
                    : 'text-[#ef4444]'
                  }`}>
                    {runScore.toFixed(0)}/100
                  </span>
                </div>
              )}

              {/* Jobs in run */}
              {selectedRun.run_items && selectedRun.run_items.length > 0 && (
                <div className="mt-2 pt-2 border-t border-[#1e1e2e]">
                  <p className="text-[10px] text-[#64748b] mb-2">Jobs in run:</p>
                  {selectedRun.run_items.map((item) => (
                    <div key={item.id} className="flex justify-between text-xs py-1">
                      <span className="text-[#94a3b8]">{item.job?.job_number || '—'}</span>
                      <span className="text-[#64748b]">{item.width_mm}mm · {item.position}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
