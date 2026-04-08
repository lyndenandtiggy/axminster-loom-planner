'use client';

import { useState } from 'react';
import type { Job } from '@/types';
import JobCard from './JobCard';

interface JobsPanelProps {
  jobs: Job[];
  selectedJob: Job | null;
  onSelectJob: (job: Job) => void;
  onJobCreated: () => void;
}

const WEAVE_TYPES = ['Axminster', 'Wilton', 'Gripper', 'Spool'];

export default function JobsPanel({ jobs, selectedJob, onSelectJob, onJobCreated }: JobsPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const [form, setForm] = useState({
    job_number: '',
    customer: '',
    weave_type: '',
    width_mm: '',
    length_m: '',
    due_date: '',
    priority: '3',
  });

  const filteredJobs = filter === 'all'
    ? jobs
    : jobs.filter((j) => j.status === filter);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_number: form.job_number || null,
          customer: form.customer || null,
          weave_type: form.weave_type || null,
          width_mm: form.width_mm ? parseInt(form.width_mm) : null,
          length_m: form.length_m ? parseInt(form.length_m) : null,
          due_date: form.due_date || null,
          priority: form.priority ? parseInt(form.priority) : null,
          status: 'pending',
        }),
      });
      if (res.ok) {
        setForm({ job_number: '', customer: '', weave_type: '', width_mm: '', length_m: '', due_date: '', priority: '3' });
        setShowForm(false);
        onJobCreated();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-[#1e1e2e]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[#e2e8f0] uppercase tracking-wider">Jobs</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-150 focus:outline-none
              ${showForm
                ? 'bg-[#1e1e2e] text-[#64748b] hover:bg-[#2d2d42]'
                : 'bg-[#6366f1] text-white hover:bg-[#5355cc]'
              }`}
          >
            {showForm ? (
              <>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1 1L11 11M1 11L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Cancel
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1V11M1 6H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                New Job
              </>
            )}
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1">
          {['all', 'pending', 'running', 'complete'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 text-[10px] font-medium py-1 rounded transition-all duration-100 focus:outline-none
                ${filter === f
                  ? 'bg-[#6366f1]/20 text-[#818cf8]'
                  : 'text-[#64748b] hover:text-[#94a3b8]'
                }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="border-b border-[#1e1e2e] p-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
            <input
              type="text"
              placeholder="Job number"
              value={form.job_number}
              onChange={(e) => setForm({ ...form, job_number: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg text-[#e2e8f0] placeholder-[#64748b] focus:outline-none focus:border-[#6366f1]/60"
            />
            <input
              type="text"
              placeholder="Customer name"
              value={form.customer}
              onChange={(e) => setForm({ ...form, customer: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg text-[#e2e8f0] placeholder-[#64748b] focus:outline-none focus:border-[#6366f1]/60"
            />
            <select
              value={form.weave_type}
              onChange={(e) => setForm({ ...form, weave_type: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg text-[#e2e8f0] focus:outline-none focus:border-[#6366f1]/60"
            >
              <option value="">Weave type</option>
              {WEAVE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Width (mm)"
                value={form.width_mm}
                onChange={(e) => setForm({ ...form, width_mm: e.target.value })}
                className="px-3 py-2 text-sm bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg text-[#e2e8f0] placeholder-[#64748b] focus:outline-none focus:border-[#6366f1]/60"
              />
              <input
                type="number"
                placeholder="Length (m)"
                value={form.length_m}
                onChange={(e) => setForm({ ...form, length_m: e.target.value })}
                className="px-3 py-2 text-sm bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg text-[#e2e8f0] placeholder-[#64748b] focus:outline-none focus:border-[#6366f1]/60"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="px-3 py-2 text-sm bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg text-[#e2e8f0] focus:outline-none focus:border-[#6366f1]/60"
              />
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="px-3 py-2 text-sm bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg text-[#e2e8f0] focus:outline-none focus:border-[#6366f1]/60"
              >
                {[1, 2, 3, 4, 5].map((p) => (
                  <option key={p} value={p}>Priority {p}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 text-sm font-medium bg-[#6366f1] hover:bg-[#5355cc] disabled:opacity-50 text-white rounded-lg transition-colors focus:outline-none"
            >
              {loading ? 'Creating...' : 'Create Job'}
            </button>
          </form>
        </div>
      )}

      {/* Jobs list */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {filteredJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="opacity-30">
              <rect x="6" y="4" width="20" height="24" rx="2" stroke="#64748b" strokeWidth="1.5" />
              <path d="M11 10H21M11 15H21M11 20H17" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <p className="text-xs text-[#64748b]">No jobs found</p>
          </div>
        ) : (
          filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              selected={selectedJob?.id === job.id}
              onClick={() => onSelectJob(job)}
            />
          ))
        )}
      </div>

      {/* Footer count */}
      <div className="p-3 border-t border-[#1e1e2e]">
        <p className="text-xs text-[#64748b] text-center">
          {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}
