import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { param } from '../lib/params';

const router = Router();

// ─── Validation ───────────────────────────────────────────────

const CreateSubjectSchema = z.object({
  name:  z.string().min(1, 'Ders adı zorunludur').max(100),
  code:  z.string().max(10).toUpperCase().optional().or(z.literal('')),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Geçersiz renk kodu').optional().or(z.literal('')),
});

const UpdateSubjectSchema = CreateSubjectSchema.partial();

// ─── GET /api/subjects ────────────────────────────────────────
router.get('/', async (_req: Request, res: Response) => {
  const subjects = await prisma.subject.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { assignments: true, constraints: true } },
    },
  });
  res.json({ success: true, data: subjects, count: subjects.length });
});

// ─── GET /api/subjects/:id ────────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  const subject = await prisma.subject.findUnique({
    where: { id: param(req, 'id') },
    include: { constraints: true, assignments: { include: { teacher: true, grade: true } } },
  });
  if (!subject) {
    res.status(404).json({ success: false, error: 'Ders bulunamadı' });
    return;
  }
  res.json({ success: true, data: subject });
});

// ─── POST /api/subjects ───────────────────────────────────────
router.post('/', async (req: Request, res: Response) => {
  const parsed = CreateSubjectSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.flatten() });
    return;
  }
  const subject = await prisma.subject.create({ data: parsed.data });
  res.status(201).json({ success: true, data: subject });
});

// ─── PUT /api/subjects/:id ────────────────────────────────────
router.put('/:id', async (req: Request, res: Response) => {
  const parsed = UpdateSubjectSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.flatten() });
    return;
  }
  const existing = await prisma.subject.findUnique({ where: { id: param(req, 'id') } });
  if (!existing) {
    res.status(404).json({ success: false, error: 'Ders bulunamadı' });
    return;
  }
  const subject = await prisma.subject.update({
    where: { id: param(req, 'id') },
    data: parsed.data,
  });
  res.json({ success: true, data: subject });
});

// ─── DELETE /api/subjects/:id ─────────────────────────────────
router.delete('/:id', async (req: Request, res: Response) => {
  const existing = await prisma.subject.findUnique({ where: { id: param(req, 'id') } });
  if (!existing) {
    res.status(404).json({ success: false, error: 'Ders bulunamadı' });
    return;
  }
  await prisma.subject.delete({ where: { id: param(req, 'id') } });
  res.json({ success: true, message: 'Ders silindi' });
});

export default router;
