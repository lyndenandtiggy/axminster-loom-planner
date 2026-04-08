'use client';

import type { Loom, Run } from '@/types';
import RunBlock from './RunBlock';

interface LoomLaneProps {
  loom: Loom;
  runs: Run[];
  onRunClick?: (run: Run) => void;
}

export default function LoomLane({ loom, runs, onRunClick }: LoomLaneProps) {
  const loomRuns = runs.filter((r) => r.loom_id === loom.id);

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
        <div className="text-xs text-[#64748b] text-right">
          <div className="text-[#94a3b8] font-medium">{loom.nominal_speed}m/h</div>
          <div>{loomRuns.length} run{loomRuns.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

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
