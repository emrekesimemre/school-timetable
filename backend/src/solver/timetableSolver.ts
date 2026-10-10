import { asStringArray, buildSlotKeys, DAY_LABELS_TR, parseSlotKey } from '../lib/slots';

export interface SolverAssignment {
  id: string;
  hoursPerWeek: number;
  teacherId: string;
  teacherName: string;
  teacherUnavailable: unknown;
  gradeId: string;
  gradeName: string;
  subjectId: string;
  subjectName: string;
  subjectColor?: string | null;
}

export interface SolverSettings {
  daysPerWeek: number;
  hoursPerDay: number;
  maxConsecutiveSameSubject: boolean;
  maxConsecutiveHours: number;
}

export interface PlacedSlot {
  slotKey: string;
  day: string;
  period: number;
  assignmentId: string;
  teacherId: string;
  teacherName: string;
  gradeId: string;
  gradeName: string;
  subjectId: string;
  subjectName: string;
  subjectColor?: string | null;
}

export interface SolverSuccess {
  ok: true;
  slots: PlacedSlot[];
  daysPerWeek: number;
  hoursPerDay: number;
}

export interface SolverFailure {
  ok: false;
  error: string;
  bottleneck: {
    teacherName?: string;
    gradeName?: string;
    subjectName?: string;
    placed: number;
    required: number;
    reason: string;
  };
}

export type SolverResult = SolverSuccess | SolverFailure;

interface WorkAssignment {
  id: string;
  hoursPerWeek: number;
  remaining: number;
  teacherId: string;
  teacherName: string;
  unavailable: Set<string>;
  gradeId: string;
  gradeName: string;
  subjectId: string;
  subjectName: string;
  subjectColor?: string | null;
}

const MAX_NODES = 2_500_000;

class SearchLimit extends Error {
  constructor() {
    super('SEARCH_LIMIT');
  }
}

export function solveTimetable(
  assignments: SolverAssignment[],
  settings: SolverSettings
): SolverResult {
  const { daysPerWeek, hoursPerDay } = settings;
  const totalSlots = daysPerWeek * hoursPerDay;
  const allSlots = buildSlotKeys(daysPerWeek, hoursPerDay);

  if (assignments.length === 0) {
    return {
      ok: false,
      error: 'Çözülecek atama yok. Önce öğretmenlere sınıf ve ders atayın.',
      bottleneck: { placed: 0, required: 0, reason: 'empty_assignments' },
    };
  }

  const work: WorkAssignment[] = assignments.map((a) => ({
    id: a.id,
    hoursPerWeek: a.hoursPerWeek,
    remaining: a.hoursPerWeek,
    teacherId: a.teacherId,
    teacherName: a.teacherName,
    unavailable: new Set(asStringArray(a.teacherUnavailable)),
    gradeId: a.gradeId,
    gradeName: a.gradeName,
    subjectId: a.subjectId,
    subjectName: a.subjectName,
    subjectColor: a.subjectColor,
  }));

  // Pre-check: class capacity
  const hoursByGrade = new Map<string, { name: string; hours: number }>();
  for (const a of work) {
    const cur = hoursByGrade.get(a.gradeId) ?? { name: a.gradeName, hours: 0 };
    cur.hours += a.hoursPerWeek;
    hoursByGrade.set(a.gradeId, cur);
  }
  for (const [gradeId, info] of hoursByGrade) {
    if (info.hours > totalSlots) {
      return {
        ok: false,
        error: `Çözülemedi: ${info.name} sınıfının toplam ders saati (${info.hours}) haftalık kapasiteyi (${totalSlots}) aşıyor.`,
        bottleneck: {
          gradeName: info.name,
          placed: 0,
          required: info.hours,
          reason: 'class_capacity',
        },
      };
    }
    void gradeId;
  }

  // Pre-check: teacher availability vs required hours
  const hoursByTeacher = new Map<string, { name: string; hours: number; unavailable: Set<string> }>();
  for (const a of work) {
    const cur = hoursByTeacher.get(a.teacherId) ?? {
      name: a.teacherName,
      hours: 0,
      unavailable: a.unavailable,
    };
    cur.hours += a.hoursPerWeek;
    hoursByTeacher.set(a.teacherId, cur);
  }
  for (const info of hoursByTeacher.values()) {
    const available = totalSlots - info.unavailable.size;
    if (info.hours > available) {
      return {
        ok: false,
        error: `Çözülemedi: ${info.name} öğretmeninin ${info.hours} saatlik ataması var ancak yalnızca ${available} saat/hafta müsait (${info.unavailable.size} slot engelli).`,
        bottleneck: {
          teacherName: info.name,
          placed: 0,
          required: info.hours,
          reason: 'teacher_capacity',
        },
      };
    }
  }

  const teacherBusy = new Map<string, Set<string>>();
  const gradeBusy = new Map<string, Set<string>>();
  const gradeSubjectAt = new Map<string, string>(); // `${gradeId}|${slotKey}` -> subjectId
  const placed: PlacedSlot[] = [];

  let nodes = 0;
  let lastFail: SolverFailure['bottleneck'] | null = null;

  const occupy = (a: WorkAssignment, slotKey: string) => {
    if (!teacherBusy.has(a.teacherId)) teacherBusy.set(a.teacherId, new Set());
    if (!gradeBusy.has(a.gradeId)) gradeBusy.set(a.gradeId, new Set());
    teacherBusy.get(a.teacherId)!.add(slotKey);
    gradeBusy.get(a.gradeId)!.add(slotKey);
    gradeSubjectAt.set(`${a.gradeId}|${slotKey}`, a.subjectId);
    const { day, period } = parseSlotKey(slotKey);
    placed.push({
      slotKey,
      day,
      period,
      assignmentId: a.id,
      teacherId: a.teacherId,
      teacherName: a.teacherName,
      gradeId: a.gradeId,
      gradeName: a.gradeName,
      subjectId: a.subjectId,
      subjectName: a.subjectName,
      subjectColor: a.subjectColor,
    });
    a.remaining -= 1;
  };

  const release = (a: WorkAssignment, slotKey: string) => {
    teacherBusy.get(a.teacherId)?.delete(slotKey);
    gradeBusy.get(a.gradeId)?.delete(slotKey);
    gradeSubjectAt.delete(`${a.gradeId}|${slotKey}`);
    placed.pop();
    a.remaining += 1;
  };

  const consecutiveOk = (a: WorkAssignment, slotKey: string): boolean => {
    if (!settings.maxConsecutiveSameSubject) return true;
    const max = Math.max(1, settings.maxConsecutiveHours);
    const { day, period } = parseSlotKey(slotKey);

    let run = 1;
    for (let p = period - 1; p >= 1; p--) {
      const subj = gradeSubjectAt.get(`${a.gradeId}|${day}_${p}`);
      if (subj !== a.subjectId) break;
      run += 1;
    }
    for (let p = period + 1; p <= hoursPerDay; p++) {
      const subj = gradeSubjectAt.get(`${a.gradeId}|${day}_${p}`);
      if (subj !== a.subjectId) break;
      run += 1;
    }
    return run <= max;
  };

  const isValid = (a: WorkAssignment, slotKey: string): boolean => {
    if (a.unavailable.has(slotKey)) return false;
    if (teacherBusy.get(a.teacherId)?.has(slotKey)) return false;
    if (gradeBusy.get(a.gradeId)?.has(slotKey)) return false;
    if (!consecutiveOk(a, slotKey)) return false;
    return true;
  };

  const candidateCount = (a: WorkAssignment): number => {
    let n = 0;
    for (const slot of allSlots) {
      if (isValid(a, slot)) n += 1;
    }
    return n;
  };

  const forwardCheck = (): boolean => {
    for (const a of work) {
      if (a.remaining <= 0) continue;
      if (candidateCount(a) < a.remaining) return false;
    }
    return true;
  };

  const pickNext = (): WorkAssignment | null => {
    let best: WorkAssignment | null = null;
    let bestScore = Infinity;
    for (const a of work) {
      if (a.remaining <= 0) continue;
      const options = candidateCount(a);
      // MRV, then most remaining hours
      const score = options * 1000 - a.remaining;
      if (score < bestScore) {
        bestScore = score;
        best = a;
      }
    }
    return best;
  };

  const recordFail = (a: WorkAssignment, reason: string) => {
    lastFail = {
      teacherName: a.teacherName,
      gradeName: a.gradeName,
      subjectName: a.subjectName,
      placed: a.hoursPerWeek - a.remaining,
      required: a.hoursPerWeek,
      reason,
    };
  };

  const search = (): boolean => {
    nodes += 1;
    if (nodes > MAX_NODES) throw new SearchLimit();

    const next = pickNext();
    if (!next) return true;

    const options = allSlots.filter((s) => isValid(next, s));
    if (options.length === 0) {
      const teacherBlocked = next.unavailable.size;
      const reason =
        teacherBlocked > 0 && candidateCount(next) === 0
          ? 'teacher_or_class_conflict'
          : 'no_slot';
      recordFail(next, reason);
      return false;
    }

    // Prefer spreading across days: sort by how many of this assignment already sit on that day
    const dayLoad = new Map<string, number>();
    for (const s of placed) {
      if (s.assignmentId === next.id) {
        dayLoad.set(s.day, (dayLoad.get(s.day) ?? 0) + 1);
      }
    }
    options.sort((x, y) => {
      const dx = parseSlotKey(x);
      const dy = parseSlotKey(y);
      const loadDiff = (dayLoad.get(dx.day) ?? 0) - (dayLoad.get(dy.day) ?? 0);
      if (loadDiff !== 0) return loadDiff;
      if (dx.day !== dy.day) return dx.day.localeCompare(dy.day);
      return dx.period - dy.period;
    });

    for (const slot of options) {
      occupy(next, slot);
      if (forwardCheck() && search()) return true;
      release(next, slot);
    }

    recordFail(next, 'exhausted_options');
    return false;
  };

  try {
    const solved = search();
    if (!solved) {
      const b = lastFail ?? {
        placed: 0,
        required: 0,
        reason: 'unsolvable',
      };
      return {
        ok: false,
        error: formatBottleneck(b, settings),
        bottleneck: b,
      };
    }
    return {
      ok: true,
      slots: placed,
      daysPerWeek,
      hoursPerDay,
    };
  } catch (err) {
    if (err instanceof SearchLimit) {
      const b = lastFail ?? {
        placed: 0,
        required: 0,
        reason: 'timeout',
      };
      return {
        ok: false,
        error: `Arama limiti aşıldı; program üretilemedi. ${formatBottleneck(b, settings)}`,
        bottleneck: b,
      };
    }
    throw err;
  }
}

function formatBottleneck(
  b: SolverFailure['bottleneck'],
  settings: SolverSettings
): string {
  const parts: string[] = ['Çözülemedi:'];
  if (b.teacherName && b.subjectName && b.gradeName) {
    parts.push(
      `${b.teacherName} öğretmeninin "${b.subjectName}" dersi (${b.gradeName}) yerleştirilemedi (${b.placed}/${b.required} saat).`
    );
  } else if (b.teacherName) {
    parts.push(`${b.teacherName} öğretmeni darboğaz oluşturdu.`);
  } else if (b.gradeName) {
    parts.push(`${b.gradeName} sınıfı darboğaz oluşturdu.`);
  }

  if (b.reason === 'teacher_capacity') {
    parts.push('Öğretmenin müsait saatleri yetersiz.');
  } else if (b.reason === 'class_capacity') {
    parts.push('Sınıfın haftalık ders kapasitesi aşıldı.');
  } else if (b.reason === 'teacher_or_class_conflict') {
    parts.push(
      'Öğretmenin unavailable_slots değerleri, sınıf çakışması veya ardışık ders kuralı uygun slot bırakmadı.'
    );
  } else if (settings.maxConsecutiveSameSubject) {
    parts.push(
      `Aynı dersten en fazla ${settings.maxConsecutiveHours} ardışık saat kuralı da aramayı daraltmış olabilir.`
    );
  }

  const dayHint = Object.entries(DAY_LABELS_TR)
    .slice(0, settings.daysPerWeek)
    .map(([, label]) => label)
    .join(', ');
  parts.push(`Izgara: ${settings.daysPerWeek} gün × ${settings.hoursPerDay} saat (${dayHint}).`);
  return parts.join(' ');
}
