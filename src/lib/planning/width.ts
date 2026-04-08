import type { WidthAllocation } from '@/types';

export function calculateWidthAllocation(
  loomWidth: number,
  job1Width: number,
  job2Width?: number
): WidthAllocation {
  if (!job2Width) {
    const waste = loomWidth - job1Width;
    return {
      job1: job1Width,
      job2: 0,
      waste: Math.max(0, waste),
      fits: job1Width <= loomWidth,
    };
  }

  const totalRequired = job1Width + job2Width;
  const waste = loomWidth - totalRequired;

  return {
    job1: job1Width,
    job2: job2Width,
    waste: Math.max(0, waste),
    fits: totalRequired <= loomWidth,
  };
}
