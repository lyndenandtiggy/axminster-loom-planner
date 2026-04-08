import type { Job, Loom } from '@/types';
import { calculateWidthAllocation, calculateRemainingWidth } from './width';

export function canPair(job1: Job, job2: Job, loom: Loom): boolean {
  if (!loom.usable_width_mm) return false;
  if (!job1.width_mm || !job2.width_mm) return false;

  const allocation = calculateWidthAllocation(
    loom.usable_width_mm,
    job1.width_mm,
    job2.width_mm
  );

  const wastePercent = allocation.waste / loom.usable_width_mm;
  return allocation.fits && wastePercent <= 0.15;
}

/**
 * Greedy best-pairing for two jobs at a time (legacy helper, still used by DetailsPanel).
 */
export function findBestPairing(
  jobs: Job[],
  loom: Loom
): [Job, Job | null][] {
  const pairs: [Job, Job | null][] = [];
  const used = new Set<string>();

  for (let i = 0; i < jobs.length; i++) {
    if (used.has(jobs[i].id)) continue;

    let bestPartner: Job | null = null;
    let bestWaste = Infinity;

    for (let j = i + 1; j < jobs.length; j++) {
      if (used.has(jobs[j].id)) continue;

      if (canPair(jobs[i], jobs[j], loom)) {
        const allocation = calculateWidthAllocation(
          loom.usable_width_mm!,
          jobs[i].width_mm!,
          jobs[j].width_mm!
        );
        if (allocation.waste < bestWaste) {
          bestWaste = allocation.waste;
          bestPartner = jobs[j];
        }
      }
    }

    pairs.push([jobs[i], bestPartner]);
    used.add(jobs[i].id);
    if (bestPartner) used.add(bestPartner.id);
  }

  return pairs;
}

/**
 * Pack jobs into runs for a given loom using a greedy first-fit approach.
 * Each run holds as many jobs as fit within the loom width — no artificial
 * cap on job count per run. Returns an array of job groups, one group per run.
 */
export function packJobsForLoom(
  jobs: Job[],
  loom: Loom
): Job[][] {
  const loomWidth = loom.usable_width_mm ?? 0;
  if (loomWidth === 0) return [];

  const runs: Job[][] = [];
  const remaining = jobs.filter((j) => (j.width_mm ?? 0) > 0 && (j.width_mm ?? 0) <= loomWidth);

  while (remaining.length > 0) {
    const run: Job[] = [];
    const inRun = new Set<string>();
    let usedWidth = 0;

    // First-fit: add every job that still fits
    for (const job of remaining) {
      const w = job.width_mm ?? 0;
      if (w > 0 && usedWidth + w <= loomWidth && !inRun.has(job.id)) {
        run.push(job);
        inRun.add(job.id);
        usedWidth += w;
      }
    }

    if (run.length === 0) break;

    // Remove packed jobs from pool
    for (const j of run) {
      const idx = remaining.findIndex((r) => r.id === j.id);
      if (idx !== -1) remaining.splice(idx, 1);
    }

    runs.push(run);
  }

  return runs;
}

/**
 * Whether a job can be added to an existing run (enough remaining width).
 */
export function canAddJobToRun(
  job: Job,
  existingItems: { width_mm: number | null }[],
  loom: Loom
): boolean {
  if (!loom.usable_width_mm || !job.width_mm) return false;
  const remaining = calculateRemainingWidth(loom.usable_width_mm, existingItems);
  return job.width_mm <= remaining;
}
