export const DAY_KEYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;
export const DAY_LABELS_TR: Record<string, string> = {
  MON: 'Pazartesi',
  TUE: 'Salı',
  WED: 'Çarşamba',
  THU: 'Perşembe',
  FRI: 'Cuma',
  SAT: 'Cumartesi',
  SUN: 'Pazar',
};

export function buildSlotKeys(daysPerWeek: number, hoursPerDay: number): string[] {
  const keys: string[] = [];
  for (let d = 0; d < daysPerWeek; d++) {
    for (let p = 1; p <= hoursPerDay; p++) {
      keys.push(`${DAY_KEYS[d]}_${p}`);
    }
  }
  return keys;
}

export function parseSlotKey(slotKey: string): { day: string; period: number } {
  const [day, periodRaw] = slotKey.split('_');
  return { day, period: Number(periodRaw) };
}

export function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}
