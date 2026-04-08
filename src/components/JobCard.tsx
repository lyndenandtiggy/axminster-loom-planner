'use client';

import type { Job } from '@/types';

interface JobCardProps {
  job: Job;
  selected?: boolean;
  onClick?: () => void;
}

const STATUS_COLOURS: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  running: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  complete: 'bg-green-500/10 text-green-400 border-green-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function JobCard({ job, selected, onClick }: JobCardProps) {
  const status = job.status || 'pending';
  const statusClass = STATUS_COLOURS[status] || STATUS_COLOURS.pending;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border transition-all duration-150 focus:outline-none
        ${selected
          ? 'bg-[#6366f1]/10 border-[#6366f1]/60 ring-1 ring-[#6366f1]/40'
          : 'bg-[#12121a] border-[#1e1e2e] hover:border-[#2d2d42] hover:bg-[#15151f]'
        }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="text-sm font-semibold text-[#e2e8f0] leading-tight">
            {job.job_number || 'No number'}
          </p>
          <p className="text-xs text-[#64748b] mt-0.5 truncate max-w-[140px]">
            {job.customer || 'Unknown customer'}
          </p>
        </div>
        <span className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusClass}`}>
          {status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-[#64748b]">
        {job.weave_type && (
          <span className="truncate">
            <span className="text-[#94a3b8]">Type:</span> {job.weave_type}
          </span>
        )}
        {job.width_mm && (
          <span>
            <span className="text-[#94a3b8]">W:</span> {job.width_mm}mm
          </span>
        )}
        {job.length_m && (
          <span>
            <span className="text-[#94a3b8]">L:</span> {job.length_m}m
          </span>
        )}
        {job.priority && (
          <span>
            <span className="text-[#94a3b8]">Pri:</span>{' '}
            <span className={job.priority <= 2 ? 'text-[#ef4444]' : job.priority <= 4 ? 'text-[#f59e0b]' : 'text-[#64748b]'}>
              P{job.priority}
            </span>
          </span>
        )}
      </div>

      {job.due_date && (
        <div className="mt-2 text-[10px] text-[#64748b]">
          Due: <span className="text-[#94a3b8]">{new Date(job.due_date).toLocaleDateString('en-GB')}</span>
        </div>
      )}
    </button>
  );
}
