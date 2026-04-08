'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Job, Loom, Run } from '@/types';
import JobsPanel from '@/components/JobsPanel';
import LoomBoard from '@/components/LoomBoard';
import DetailsPanel from '@/components/DetailsPanel';

export default function DashboardPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [looms, setLooms] = useState<Loom[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedRun, setSelectedRun] = useState<Run | null>(null);
  const [loading, setLoading] = useState(true);

  // Auth check
  useEffect(() => {
    const unlocked = localStorage.getItem('unlocked');
    if (unlocked !== 'true') {
      router.replace('/');
    }
  }, [router]);

  const fetchData = useCallback(async () => {
    try {
      const [jobsRes, loomsRes, runsRes] = await Promise.all([
        fetch('/api/jobs'),
        fetch('/api/looms'),
        fetch('/api/runs'),
      ]);
      const [jobsData, loomsData, runsData] = await Promise.all([
        jobsRes.json(),
        loomsRes.json(),
        runsRes.json(),
      ]);
      setJobs(Array.isArray(jobsData) ? jobsData : []);
      setLooms(Array.isArray(loomsData) ? loomsData : []);
      setRuns(Array.isArray(runsData) ? runsData : []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRunClick = (run: Run) => {
    setSelectedRun(run);
    setSelectedJob(null);
  };

  const handleSelectJob = (job: Job) => {
    setSelectedJob(job);
    setSelectedRun(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('unlocked');
    router.replace('/');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a0f]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[#64748b]">Loading planner...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0a0a0f]">
      {/* Top nav */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-[#1e1e2e] bg-[#0a0a0f] shrink-0 z-10">
        <div className="flex items-center gap-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" rx="6" fill="#6366f1" fillOpacity="0.15" />
            <rect x="4" y="8" width="16" height="1.5" rx="0.75" fill="#6366f1" />
            <rect x="4" y="11" width="16" height="1.5" rx="0.75" fill="#6366f1" />
            <rect x="4" y="14" width="16" height="1.5" rx="0.75" fill="#6366f1" />
            <rect x="7" y="6" width="1.5" height="12" rx="0.75" fill="#818cf8" />
            <rect x="15.5" y="6" width="1.5" height="12" rx="0.75" fill="#818cf8" />
          </svg>
          <div>
            <h1 className="text-sm font-semibold text-[#e2e8f0]">Axminster Loom Planner</h1>
            <p className="text-[10px] text-[#64748b]">Internal Planning Tool</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Stats */}
          <div className="hidden md:flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
              <span className="text-[#64748b]">
                {jobs.filter((j) => j.status === 'pending').length} pending
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
              <span className="text-[#64748b]">
                {jobs.filter((j) => j.status === 'running').length} running
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
              <span className="text-[#64748b]">
                {looms.length} looms
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="text-xs text-[#64748b] hover:text-[#94a3b8] transition-colors focus:outline-none"
          >
            Lock
          </button>
        </div>
      </header>

      {/* Main 3-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel - Jobs */}
        <aside className="w-[280px] shrink-0 border-r border-[#1e1e2e] overflow-hidden flex flex-col">
          <JobsPanel
            jobs={jobs}
            selectedJob={selectedJob}
            onSelectJob={handleSelectJob}
            onJobCreated={fetchData}
          />
        </aside>

        {/* Center panel - Loom board */}
        <main className="flex-1 overflow-hidden flex flex-col min-w-0">
          <LoomBoard
            looms={looms}
            runs={runs}
            selectedJob={selectedJob}
            onRunClick={handleRunClick}
            onLoomCreated={fetchData}
          />
        </main>

        {/* Right panel - Details */}
        <aside className="w-[320px] shrink-0 border-l border-[#1e1e2e] overflow-hidden flex flex-col">
          <DetailsPanel
            selectedJob={selectedJob}
            selectedRun={selectedRun}
            jobs={jobs}
            looms={looms}
          />
        </aside>
      </div>
    </div>
  );
}
