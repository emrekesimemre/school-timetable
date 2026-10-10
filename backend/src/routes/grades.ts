import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { param } from '../lib/params';

const router = Router();

// ─── Validation Schemas ──────────────────────────────────────

const CreateGradeSchema = z.object({
  name: z.string().min(1, 'Grade name is required').max(20),
  year: z.number().int().min(1).max(13).optional(),
  studentCount: z.number().int().min(1).max(60).optional(),
});

const UpdateGradeSchema = CreateGradeSchema.partial();

// ─── GET /api/grades ─────────────────────────────────────────
router.get('/', async (_req: Request, res: Response) => {
  const grades = await prisma.grade.findMany({
    orderBy: [{ year: 'asc' }, { name: 'asc' }],
    include: {
      _count: { select: { assignments: true } },
    },
  });

  res.json({ success: true, data: grades, count: grades.length });
});

// ─── GET /api/grades/:id ─────────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  const grade = await prisma.grade.findUnique({
    where: { id: param(req, 'id') },
    include: {
      assignments: {
        include: { teacher: true, subject: true },
      },
    },
  });

  if (!grade) {
    res.status(404).json({ success: false, error: 'Grade not found' });
    return;
  }

  res.json({ success: true, data: grade });
});

// ─── POST /api/grades ────────────────────────────────────────
router.post('/', async (req: Request, res: Response) => {
  const parsed = CreateGradeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.flatten() });
    return;
  }

  const grade = await prisma.grade.create({ data: parsed.data });
  res.status(201).json({ success: true, data: grade });
});

// ─── PUT /api/grades/:id ─────────────────────────────────────
router.put('/:id', async (req: Request, res: Response) => {
  const parsed = UpdateGradeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.flatten() });
    return;
  }

  const existing = await prisma.grade.findUnique({ where: { id: param(req, 'id') } });
  if (!existing) {
    res.status(404).json({ success: false, error: 'Grade not found' });
    return;
  }

  const grade = await prisma.grade.update({
    where: { id: param(req, 'id') },
    data: parsed.data,
  });

  res.json({ success: true, data: grade });
});

// ─── DELETE /api/grades/:id ──────────────────────────────────
router.delete('/:id', async (req: Request, res: Response) => {
  const existing = await prisma.grade.findUnique({ where: { id: param(req, 'id') } });
  if (!existing) {
    res.status(404).json({ success: false, error: 'Grade not found' });
    return;
  }

  await prisma.grade.delete({ where: { id: param(req, 'id') } });
  res.json({ success: true, message: 'Grade deleted successfully' });
});

export default router;
