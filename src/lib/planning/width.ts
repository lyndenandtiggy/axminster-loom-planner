import type { WidthAllocation } from '@/types';

/**
 * Single or two-job allocation (kept for backward compatibility).
 */
export function calculateWidthAllocation(
  loomWidth: number,
  job1Width: number,
  job2Width?: number
): WidthAllocation {
  if (!job2Width) {
    return {
      job1: job1Width,
      job2: 0,
      waste: Math.max(0, loomWidth - job1Width),
      fits: job1Width <= loomWidth,
    };
  }
  const total = job1Width + job2Width;
  return {
    job1: job1Width,
    job2: job2Width,
    waste: Math.max(0, loomWidth - total),
    fits: total <= loomWidth,
  };
}

export interface MultiJobAllocation {
  /** Width allocated to each job (same order as input). */
  allocations: number[];
  /** Cumulative left-offset in mm for each job segment. */
  offsets: number[];
  totalAllocated: number;
  waste: number;
  fits: boolean;
}

/**
 * Calculate width allocation for any number of jobs on a loom.
 * Jobs are packed left-to-right in the order given.
 */
export function calculateMultiJobAllocation(
  loomWidth: number,
  jobWidths: number[]
): MultiJobAllocation {
  const totalAllocated = jobWidths.reduce((sum, w) => sum + w, 0);
  const waste = Math.max(0, loomWidth - totalAllocated);
  const fits = totalAllocated <= loomWidth;

  const offsets: number[] = [];
  let cursor = 0;
  for (const w of jobWidths) {
    offsets.push(cursor);
    cursor += w;
  }

  return { allocations: jobWidths, offsets, totalAllocated, waste, fits };
}

/**
 * How much loom width remains after accounting for already-allocated run items.
 */
export function calculateRemainingWidth(
  loomWidth: number,
  runItems: { width_mm: number | null }[]
): number {
  const allocated = runItems.reduce((sum, item) => sum + (item.width_mm ?? 0), 0);
  return Math.max(0, loomWidth - allocated);
}
