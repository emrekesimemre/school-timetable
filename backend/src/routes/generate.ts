import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { solveTimetable, type SolverAssignment } from '../solver/timetableSolver';

const router = Router();

async function loadSettings() {
  return prisma.schoolSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: { id: 'default' },
  });
}

type SlotRow = {
  slotKey: string;
  day: string;
  period: number;
  assignmentId: string;
  teacherId: string;
  gradeId: string;
  subjectId: string;
  teacher: { id: string; name: string };
  grade: { id: string; name: string };
  subject: { id: string; name: string; color: string | null };
};

function toView(slots: SlotRow[]) {
  const byClass: Record<string, {
    gradeId: string;
    gradeName: string;
    slots: Record<string, unknown>;
  }> = {};
  const byTeacher: Record<string, {
    teacherId: string;
    teacherName: string;
    slots: Record<string, unknown>;
  }> = {};

  const mapped = slots.map((s) => {
    const cell = {
      slotKey: s.slotKey,
      day: s.day,
      period: s.period,
      assignmentId: s.assignmentId,
      teacherId: s.teacherId,
      teacherName: s.teacher.name,
      gradeId: s.gradeId,
      gradeName: s.grade.name,
      subjectId: s.subjectId,
      subjectName: s.subject.name,
      subjectColor: s.subject.color,
    };

    if (!byClass[s.grade.name]) {
      byClass[s.grade.name] = { gradeId: s.gradeId, gradeName: s.grade.name, slots: {} };
    }
    byClass[s.grade.name].slots[s.slotKey] = cell;

    if (!byTeacher[s.teacher.name]) {
      byTeacher[s.teacher.name] = { teacherId: s.teacherId, teacherName: s.teacher.name, slots: {} };
    }
    byTeacher[s.teacher.name].slots[s.slotKey] = cell;

    return cell;
  });

  return { slots: mapped, byClass, byTeacher };
}

router.post('/', async (_req: Request, res: Response) => {
  const [settings, assignments] = await Promise.all([
    loadSettings(),
    prisma.assignment.findMany({
      include: {
        teacher: true,
        grade: true,
        subject: true,
      },
    }),
  ]);

  const solverInput: SolverAssignment[] = assignments.map((a) => ({
    id: a.id,
    hoursPerWeek: a.hoursPerWeek,
    teacherId: a.teacherId,
    teacherName: a.teacher.name,
    teacherUnavailable: a.teacher.unavailable_slots,
    gradeId: a.gradeId,
    gradeName: a.grade.name,
    subjectId: a.subjectId,
    subjectName: a.subject.name,
    subjectColor: a.subject.color,
  }));

  const result = solveTimetable(solverInput, {
    daysPerWeek: settings.daysPerWeek,
    hoursPerDay: settings.hoursPerDay,
    maxConsecutiveSameSubject: settings.maxConsecutiveSameSubject,
    maxConsecutiveHours: settings.maxConsecutiveHours,
  });

  if (!result.ok) {
    res.status(422).json({
      success: false,
      error: result.error,
      bottleneck: result.bottleneck,
    });
    return;
  }

  const timetable = await prisma.$transaction(async (tx) => {
    await tx.timetable.updateMany({
      where: { status: 'ACTIVE' },
      data: { status: 'SUPERSEDED' },
    });

    return tx.timetable.create({
      data: {
        status: 'ACTIVE',
        daysPerWeek: result.daysPerWeek,
        hoursPerDay: result.hoursPerDay,
        slots: {
          create: result.slots.map((s) => ({
            slotKey: s.slotKey,
            day: s.day,
            period: s.period,
            assignmentId: s.assignmentId,
            teacherId: s.teacherId,
            gradeId: s.gradeId,
            subjectId: s.subjectId,
          })),
        },
      },
      include: {
        slots: {
          include: {
            teacher: { select: { id: true, name: true } },
            grade: { select: { id: true, name: true } },
            subject: { select: { id: true, name: true, color: true } },
          },
        },
      },
    });
  });

  const views = toView(timetable.slots);

  res.json({
    success: true,
    data: {
      timetableId: timetable.id,
      generatedAt: timetable.createdAt,
      daysPerWeek: timetable.daysPerWeek,
      hoursPerDay: timetable.hoursPerDay,
      stats: {
        placedLessons: timetable.slots.length,
        assignments: assignments.length,
        classes: Object.keys(views.byClass).length,
        teachers: Object.keys(views.byTeacher).length,
      },
      ...views,
    },
  });
});

router.get('/', async (_req: Request, res: Response) => {
  const timetable = await prisma.timetable.findFirst({
    where: { status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
    include: {
      slots: {
        include: {
          teacher: { select: { id: true, name: true } },
          grade: { select: { id: true, name: true } },
          subject: { select: { id: true, name: true, color: true } },
        },
      },
    },
  });

  if (!timetable) {
    res.status(404).json({ success: false, error: 'Henüz üretilmiş bir ders programı yok' });
    return;
  }

  const views = toView(timetable.slots);
  res.json({
    success: true,
    data: {
      timetableId: timetable.id,
      generatedAt: timetable.createdAt,
      daysPerWeek: timetable.daysPerWeek,
      hoursPerDay: timetable.hoursPerDay,
      stats: {
        placedLessons: timetable.slots.length,
        classes: Object.keys(views.byClass).length,
        teachers: Object.keys(views.byTeacher).length,
      },
      ...views,
    },
  });
});

export default router;
