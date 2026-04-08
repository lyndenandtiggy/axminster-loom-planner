import type { Job, Loom } from '@/types';
import { calculateWidthAllocation } from './width';

export function canPair(job1: Job, job2: Job, loom: Loom): boolean {
  if (!loom.usable_width_mm) return false;
  if (!job1.width_mm || !job2.width_mm) return false;

  const allocation = calculateWidthAllocation(
    loom.usable_width_mm,
    job1.width_mm,
    job2.width_mm
  );

  // Must fit and waste should not exceed 15% of loom width
  const wastePercent = allocation.waste / loom.usable_width_mm;
  return allocation.fits && wastePercent <= 0.15;
}

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
