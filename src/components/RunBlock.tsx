'use client';

import type { Run } from '@/types';

interface RunBlockProps {
  run: Run;
  loomWidth: number;
  onClick?: () => void;
}

export default function RunBlock({ run, loomWidth, onClick }: RunBlockProps) {
  const items = run.run_items || [];

  return (
    <button
      onClick={onClick}
      className="flex h-12 w-full rounded-lg overflow-hidden border border-[#2d2d42] hover:border-[#6366f1]/50 transition-all duration-150 focus:outline-none"
    >
      {items.map((item, i) => {
        const widthPercent = loomWidth > 0 && item.width_mm
          ? (item.width_mm / loomWidth) * 100
          : 50;

        const colours = [
          'bg-[#6366f1]/30 hover:bg-[#6366f1]/40',
          'bg-[#10b981]/30 hover:bg-[#10b981]/40',
          'bg-[#f59e0b]/30 hover:bg-[#f59e0b]/40',
        ];

        return (
          <div
            key={item.id}
            className={`${colours[i % colours.length]} flex items-center justify-center px-2 border-r border-[#1e1e2e] last:border-r-0 transition-colors`}
            style={{ width: `${widthPercent}%` }}
            title={item.job?.job_number || 'Job'}
          >
            <span className="text-[10px] font-medium text-[#e2e8f0] truncate">
              {item.job?.job_number || '—'}
            </span>
          </div>
        );
      })}

      {/* Waste block */}
      {run.waste_width_mm && loomWidth > 0 && run.waste_width_mm > 0 && (
        <div
          className="bg-[#1e1e2e] flex items-center justify-center px-1 ml-auto"
          style={{ width: `${(run.waste_width_mm / loomWidth) * 100}%` }}
          title={`Waste: ${run.waste_width_mm}mm`}
        >
          <span className="text-[9px] text-[#64748b]">W</span>
        </div>
      )}

      {items.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[10px] text-[#64748b]">Empty run</span>
        </div>
      )}
    </button>
  );
}
