export const DEFAULT_DAYS_PER_WEEK = 5;
export const DEFAULT_HOURS_PER_DAY = 8;
export const DEFAULT_WEEKLY_HOURS = DEFAULT_DAYS_PER_WEEK * DEFAULT_HOURS_PER_DAY;

export function blockedSlotCount(unavailable: unknown): number {
  return Array.isArray(unavailable) ? unavailable.length : 0;
}

/** Available hours = total weekly hours − blocked slots. */
export function weeklyAvailableHours(
  unavailable: unknown,
  totalWeeklyHours: number = DEFAULT_WEEKLY_HOURS
): number {
  return Math.max(0, totalWeeklyHours - blockedSlotCount(unavailable));
}
