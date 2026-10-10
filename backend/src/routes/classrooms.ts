import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { param } from '../lib/params';

const router = Router();

// ─── Validation ───────────────────────────────────────────────

const ClassroomTypeEnum = z.enum(['STANDARD', 'LAB', 'GYM', 'AUDITORIUM', 'WORKSHOP']);

const CreateClassroomSchema = z.object({
  name:     z.string().min(1, 'Derslik adı zorunludur').max(100),
  capacity: z.number().int().min(1, 'Kapasite en az 1 olmalıdır').max(500),
  type:     ClassroomTypeEnum.default('STANDARD'),
  building: z.string().max(100).optional().or(z.literal('')),
});

const UpdateClassroomSchema = CreateClassroomSchema.partial();

// ─── GET /api/classrooms ──────────────────────────────────────
router.get('/', async (_req: Request, res: Response) => {
  const classrooms = await prisma.classroom.findMany({
    orderBy: [{ building: 'asc' }, { name: 'asc' }],
  });
  res.json({ success: true, data: classrooms, count: classrooms.length });
});

// ─── GET /api/classrooms/:id ──────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  const classroom = await prisma.classroom.findUnique({ where: { id: param(req, 'id') } });
  if (!classroom) {
    res.status(404).json({ success: false, error: 'Derslik bulunamadı' });
    return;
  }
  res.json({ success: true, data: classroom });
});

// ─── POST /api/classrooms ─────────────────────────────────────
router.post('/', async (req: Request, res: Response) => {
  const parsed = CreateClassroomSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.flatten() });
    return;
  }
  const classroom = await prisma.classroom.create({ data: parsed.data });
  res.status(201).json({ success: true, data: classroom });
});

// ─── PUT /api/classrooms/:id ──────────────────────────────────
router.put('/:id', async (req: Request, res: Response) => {
  const parsed = UpdateClassroomSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.flatten() });
    return;
  }
  const existing = await prisma.classroom.findUnique({ where: { id: param(req, 'id') } });
  if (!existing) {
    res.status(404).json({ success: false, error: 'Derslik bulunamadı' });
    return;
  }
  const classroom = await prisma.classroom.update({
    where: { id: param(req, 'id') },
    data: parsed.data,
  });
  res.json({ success: true, data: classroom });
});

// ─── DELETE /api/classrooms/:id ───────────────────────────────
router.delete('/:id', async (req: Request, res: Response) => {
  const existing = await prisma.classroom.findUnique({ where: { id: param(req, 'id') } });
  if (!existing) {
    res.status(404).json({ success: false, error: 'Derslik bulunamadı' });
    return;
  }
  await prisma.classroom.delete({ where: { id: param(req, 'id') } });
  res.json({ success: true, message: 'Derslik silindi' });
});

export default router;
