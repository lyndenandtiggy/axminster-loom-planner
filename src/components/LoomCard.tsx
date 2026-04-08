'use client';

import type { Loom } from '@/types';

interface LoomCardProps {
  loom: Loom;
  selected?: boolean;
  onClick?: () => void;
}

export default function LoomCard({ loom, selected, onClick }: LoomCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border transition-all duration-150 focus:outline-none
        ${selected
          ? 'bg-[#6366f1]/10 border-[#6366f1]/60 ring-1 ring-[#6366f1]/40'
          : 'bg-[#12121a] border-[#1e1e2e] hover:border-[#2d2d42] hover:bg-[#15151f]'
        }`}
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-semibold text-[#e2e8f0]">{loom.name || 'Unnamed Loom'}</p>
        {loom.loom_type && (
          <span className="text-[10px] bg-[#6366f1]/10 text-[#818cf8] border border-[#6366f1]/20 px-2 py-0.5 rounded-full">
            {loom.loom_type}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-[#64748b]">
        {loom.usable_width_mm && (
          <span><span className="text-[#94a3b8]">Width:</span> {loom.usable_width_mm}mm</span>
        )}
        {loom.creel_type && (
          <span><span className="text-[#94a3b8]">Creel:</span> {loom.creel_type}</span>
        )}
        {loom.nominal_speed && (
          <span><span className="text-[#94a3b8]">Speed:</span> {loom.nominal_speed}m/h</span>
        )}
      </div>
    </button>
  );
}
