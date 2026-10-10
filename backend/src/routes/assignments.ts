import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { param } from '../lib/params';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const assignments = await prisma.assignment.findMany({
    include: { teacher: true, grade: true, subject: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: assignments });
});

router.get('/:id', async (req: Request, res: Response) => {
  const assignment = await prisma.assignment.findUnique({
    where: { id: param(req, 'id') },
    include: { teacher: true, grade: true, subject: true },
  });
  if (!assignment) {
    res.status(404).json({ success: false, error: 'Assignment not found' });
    return;
  }
  res.json({ success: true, data: assignment });
});

router.post('/', async (req: Request, res: Response) => {
  const assignment = await prisma.assignment.create({
    data: req.body,
    include: { teacher: true, grade: true, subject: true },
  });
  res.status(201).json({ success: true, data: assignment });
});

router.put('/:id', async (req: Request, res: Response) => {
  const assignment = await prisma.assignment.update({
    where: { id: param(req, 'id') },
    data: req.body,
    include: { teacher: true, grade: true, subject: true },
  });
  res.json({ success: true, data: assignment });
});

router.delete('/:id', async (req: Request, res: Response) => {
  await prisma.assignment.delete({ where: { id: param(req, 'id') } });
  res.json({ success: true, message: 'Assignment deleted' });
});

export default router;
