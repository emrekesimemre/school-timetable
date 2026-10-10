import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { param } from '../lib/params';

const router = Router();

// ─── Validation Schemas ──────────────────────────────────────

const AssignmentInputSchema = z.object({
  gradeId:     z.string().min(1, 'Sınıf seçimi zorunludur'),
  subjectId:   z.string().min(1, 'Ders seçimi zorunludur'),
  hoursPerWeek: z.number().int().min(1).max(40),
});

const CreateTeacherSchema = z.object({
  name:              z.string().min(2, 'İsim en az 2 karakter olmalıdır'),
  email:             z.string().email('Geçersiz e-posta formatı').optional().or(z.literal('')),
  available_hours:   z.record(z.array(z.number().int().min(1).max(12))).default({}),
  unavailable_slots: z.array(z.string()).default([]),
  assignments:       z.array(AssignmentInputSchema).default([]),
});

const UpdateTeacherSchema = CreateTeacherSchema.partial();

// ─── GET /api/teachers ───────────────────────────────────────
router.get('/', async (_req: Request, res: Response) => {
  const teachers = await prisma.teacher.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { assignments: true } },
    },
  });
  res.json({ success: true, data: teachers, count: teachers.length });
});

// ─── GET /api/teachers/:id ───────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  const teacher = await prisma.teacher.findUnique({
    where: { id: param(req, 'id') },
    include: {
      assignments: {
        include: { grade: true, subject: true },
        orderBy: { createdAt: 'asc' },
      },
      _count: { select: { assignments: true } },
    },
  });
  if (!teacher) {
    res.status(404).json({ success: false, error: 'Öğretmen bulunamadı' });
    return;
  }
  res.json({ success: true, data: teacher });
});

// ─── POST /api/teachers ──────────────────────────────────────
router.post('/', async (req: Request, res: Response) => {
  const parsed = CreateTeacherSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.flatten() });
    return;
  }

  const { assignments, ...teacherData } = parsed.data;

  // Use transaction: create teacher + all assignment records atomically
  const teacher = await prisma.$transaction(async (tx) => {
    const newTeacher = await tx.teacher.create({ data: teacherData });

    if (assignments.length > 0) {
      await tx.assignment.createMany({
        data: assignments.map((a) => ({
          teacherId:    newTeacher.id,
          gradeId:      a.gradeId,
          subjectId:    a.subjectId,
          hoursPerWeek: a.hoursPerWeek,
        })),
        skipDuplicates: true,
      });
    }

    return tx.teacher.findUnique({
      where: { id: newTeacher.id },
      include: {
        assignments: { include: { grade: true, subject: true } },
        _count: { select: { assignments: true } },
      },
    });
  });

  res.status(201).json({ success: true, data: teacher });
});

// ─── PUT /api/teachers/:id ───────────────────────────────────
router.put('/:id', async (req: Request, res: Response) => {
  const parsed = UpdateTeacherSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.flatten() });
    return;
  }

  const existing = await prisma.teacher.findUnique({ where: { id: param(req, 'id') } });
  if (!existing) {
    res.status(404).json({ success: false, error: 'Öğretmen bulunamadı' });
    return;
  }

  const { assignments, ...teacherData } = parsed.data;

  const teacher = await prisma.$transaction(async (tx) => {
    const updated = await tx.teacher.update({
      where: { id: param(req, 'id') },
      data: teacherData,
    });

    // If assignments array is explicitly provided, replace all assignments
    if (assignments !== undefined) {
      await tx.assignment.deleteMany({ where: { teacherId: updated.id } });
      if (assignments.length > 0) {
        await tx.assignment.createMany({
          data: assignments.map((a) => ({
            teacherId:    updated.id,
            gradeId:      a.gradeId,
            subjectId:    a.subjectId,
            hoursPerWeek: a.hoursPerWeek,
          })),
          skipDuplicates: true,
        });
      }
    }

    return tx.teacher.findUnique({
      where: { id: updated.id },
      include: {
        assignments: { include: { grade: true, subject: true } },
        _count: { select: { assignments: true } },
      },
    });
  });

  res.json({ success: true, data: teacher });
});

// ─── DELETE /api/teachers/:id ────────────────────────────────
router.delete('/:id', async (req: Request, res: Response) => {
  const existing = await prisma.teacher.findUnique({ where: { id: param(req, 'id') } });
  if (!existing) {
    res.status(404).json({ success: false, error: 'Öğretmen bulunamadı' });
    return;
  }
  // Cascade: delete assignments first, then teacher
  await prisma.$transaction([
    prisma.assignment.deleteMany({ where: { teacherId: param(req, 'id') } }),
    prisma.teacher.delete({ where: { id: param(req, 'id') } }),
  ]);
  res.json({ success: true, message: 'Öğretmen silindi' });
});

export default router;
