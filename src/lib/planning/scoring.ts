import { classifyChangeover } from './changeover';

/** Above this job count per run, a warning factor is applied to the score. */
export const DEFAULT_PREFERRED_MAX_SPLIT = 3;

export interface ScoreRunParams {
  wasteWidth: number;
  loomWidth: number;
  setupMinutes: number;
  /** Highest-priority job in the run (lowest number = most urgent). */
  highestPriority: number;
  /** Number of jobs in the run. Used to apply a split-count warning. */
  jobCount?: number;
  /**
   * Runs with more jobs than this threshold get a small score deduction.
   * This is a soft warning, not a hard block.
   * Defaults to DEFAULT_PREFERRED_MAX_SPLIT (3).
   */
  preferredMaxSplit?: number;
}

export interface ScoreResult {
  score: number;
  wastePercent: number;
  changeoverClass: 'low' | 'medium' | 'high';
  /** True when jobCount exceeds preferredMaxSplit. */
  splitWarning: boolean;
}

export function scoreRun(params: ScoreRunParams): ScoreResult {
  const {
    wasteWidth,
    loomWidth,
    setupMinutes,
    highestPriority,
    jobCount = 1,
    preferredMaxSplit = DEFAULT_PREFERRED_MAX_SPLIT,
  } = params;

  // Waste penalty: 0–40 pts (lower waste = higher score)
  const wastePercent = loomWidth > 0 ? wasteWidth / loomWidth : 1;
  const wasteScore = (1 - wastePercent) * 40;

  // Setup penalty: 0–30 pts
  const changeoverClass = classifyChangeover(setupMinutes);
  const changeoverScore =
    changeoverClass === 'low' ? 30 : changeoverClass === 'medium' ? 15 : 0;

  // Priority bonus: 0–30 pts (priority 1 = highest urgency)
  const priorityScore = highestPriority > 0 ? Math.max(0, 30 - (highestPriority - 1) * 5) : 0;

  // Split-count soft penalty: -3 pts per job over the preferred max
  const splitWarning = jobCount > preferredMaxSplit;
  const splitPenalty = splitWarning ? (jobCount - preferredMaxSplit) * 3 : 0;

  const score = Math.max(0, Math.min(100, wasteScore + changeoverScore + priorityScore - splitPenalty));

  return { score, wastePercent, changeoverClass, splitWarning };
}
