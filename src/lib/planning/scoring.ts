import { classifyChangeover } from './changeover';

export function scoreRun(params: {
  wasteWidth: number;
  loomWidth: number;
  setupMinutes: number;
  priority: number;
}): number {
  const { wasteWidth, loomWidth, setupMinutes, priority } = params;

  // Waste penalty: 0-40 points (lower waste = higher score)
  const wastePercent = loomWidth > 0 ? wasteWidth / loomWidth : 1;
  const wasteScore = (1 - wastePercent) * 40;

  // Setup penalty: 0-30 points
  const changeoverClass = classifyChangeover(setupMinutes);
  const changeoverScore =
    changeoverClass === 'low' ? 30 : changeoverClass === 'medium' ? 15 : 0;

  // Priority bonus: 0-30 points (priority 1 = highest)
  const priorityScore = priority > 0 ? Math.max(0, 30 - (priority - 1) * 5) : 0;

  return wasteScore + changeoverScore + priorityScore;
}
