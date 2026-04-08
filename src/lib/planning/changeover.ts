export function estimateSmartCreelChangeover(params: {
  endsToLoad: number;
  endsPerHour: number;
  fixedMinutes: number;
}): number {
  const { endsToLoad, endsPerHour, fixedMinutes } = params;
  const loadingMinutes = (endsToLoad / endsPerHour) * 60;
  return fixedMinutes + loadingMinutes;
}

export function estimateTraditionalChangeover(params: {
  bobbinsToChange: number;
  bobbinsPerPersonPerHour: number;
  staffCount: number;
  diminishingReturnsMultiplier: number;
}): number {
  const {
    bobbinsToChange,
    bobbinsPerPersonPerHour,
    staffCount,
    diminishingReturnsMultiplier,
  } = params;
  const effectiveRate =
    bobbinsPerPersonPerHour * staffCount * diminishingReturnsMultiplier;
  return (bobbinsToChange / effectiveRate) * 60;
}

export function classifyChangeover(
  minutes: number
): 'low' | 'medium' | 'high' {
  if (minutes < 60) return 'low';
  if (minutes < 240) return 'medium';
  return 'high';
}
