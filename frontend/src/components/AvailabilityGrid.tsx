interface AvailabilityGridProps {
  /** Engellenen slotlar: ["MON_1", "TUE_3", "FRI_8"] */
  value: string[];
  onChange: (slots: string[]) => void;
  daysPerWeek?: number;
  hoursPerDay?: number;
}

const ALL_DAYS = [
  { key: 'MON', label: 'Pazartesi' },
  { key: 'TUE', label: 'Salı' },
  { key: 'WED', label: 'Çarşamba' },
  { key: 'THU', label: 'Perşembe' },
  { key: 'FRI', label: 'Cuma' },
  { key: 'SAT', label: 'Cumartesi' },
  { key: 'SUN', label: 'Pazar' },
];

export default function AvailabilityGrid({
  value,
  onChange,
  daysPerWeek = 5,
  hoursPerDay = 8,
}: AvailabilityGridProps) {
  const DAYS = ALL_DAYS.slice(0, daysPerWeek);
  const PERIODS = Array.from({ length: hoursPerDay }, (_, i) => i + 1);
  const totalWeeklyHours = daysPerWeek * hoursPerDay;
  const availableHours = Math.max(0, totalWeeklyHours - value.length);
  const slotSet = new Set(value);

  const toggle = (slot: string) => {
    const next = new Set(slotSet);
    if (next.has(slot)) {
      next.delete(slot);
    } else {
      next.add(slot);
    }
    onChange(Array.from(next));
  };

  const toggleAll = (dayKey: string) => {
    const daySlots = PERIODS.map((p) => `${dayKey}_${p}`);
    const allBlocked = daySlots.every((s) => slotSet.has(s));
    const next = new Set(slotSet);
    daySlots.forEach((s) => (allBlocked ? next.delete(s) : next.add(s)));
    onChange(Array.from(next));
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">
        Kırmızıya dönen hücreler o öğretmenin <span className="text-rose-400 font-medium">müsait olmadığı</span> saatleri gösterir.
        Tümünü engellemek için gün adına tıklayabilirsiniz.
      </p>

      <div className="overflow-x-auto rounded-xl border border-sidebar-border bg-sidebar-bg p-4">
        <table className="w-full border-separate border-spacing-1">
          <thead>
            <tr>
              <th className="w-28" />
              {PERIODS.map((p) => (
                <th key={p} className="text-center text-[11px] font-semibold text-slate-500 pb-1 w-12">
                  {p}. Ders
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day) => {
              const allDayBlocked = PERIODS.every((p) => slotSet.has(`${day.key}_${p}`));
              return (
                <tr key={day.key}>
                  {/* Gün başlığı — tıklanabilir */}
                  <td className="pr-2">
                    <button
                      type="button"
                      onClick={() => toggleAll(day.key)}
                      className={`text-xs font-medium px-2 py-1 rounded-md w-full text-left transition-colors ${
                        allDayBlocked
                          ? 'text-rose-400 bg-rose-500/10'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-sidebar-hover'
                      }`}
                    >
                      {day.label}
                    </button>
                  </td>

                  {/* Hücreler */}
                  {PERIODS.map((period) => {
                    const slot = `${day.key}_${period}`;
                    const blocked = slotSet.has(slot);
                    return (
                      <td key={period}>
                        <button
                          type="button"
                          onClick={() => toggle(slot)}
                          title={blocked ? `${day.label} ${period}. ders — Müsait Değil` : `${day.label} ${period}. ders — Müsait`}
                          className={`w-11 h-11 rounded-lg border-2 flex items-center justify-center
                                      transition-all duration-150 hover:scale-105 active:scale-95 ${
                            blocked
                              ? 'bg-rose-500/20 border-rose-500 hover:bg-rose-500/30 shadow-sm shadow-rose-500/20'
                              : 'bg-emerald-500/8 border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40'
                          }`}
                        >
                          {blocked && (
                            <span className="text-rose-400 text-sm font-bold leading-none">✕</span>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Lejant */}
      <div className="flex items-center gap-5 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-emerald-500/15 border border-emerald-500/30" />
          <span>Müsait</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-rose-500/20 border border-rose-500 flex items-center justify-center">
            <span className="text-rose-400 text-[10px] font-bold">✕</span>
          </div>
          <span>Müsait Değil</span>
        </div>
        <div className="ml-auto text-slate-400">
          <span className="text-emerald-400 font-medium">{availableHours} saat/hafta müsait</span>
          {value.length > 0 && (
            <span className="text-rose-400/80"> · {value.length} slot engelli</span>
          )}
        </div>
      </div>
    </div>
  );
}
