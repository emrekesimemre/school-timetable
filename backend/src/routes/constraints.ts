import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { param } from '../lib/params';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const constraints = await prisma.constraint.findMany({
    include: { subject: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: constraints });
});

router.get('/:id', async (req: Request, res: Response) => {
  const constraint = await prisma.constraint.findUnique({
    where: { id: param(req, 'id') },
    include: { subject: true },
  });
  if (!constraint) {
    res.status(404).json({ success: false, error: 'Constraint not found' });
    return;
  }
  res.json({ success: true, data: constraint });
});

router.post('/', async (req: Request, res: Response) => {
  const constraint = await prisma.constraint.create({ data: req.body });
  res.status(201).json({ success: true, data: constraint });
});

router.put('/:id', async (req: Request, res: Response) => {
  const constraint = await prisma.constraint.update({
    where: { id: param(req, 'id') },
    data: req.body,
  });
  res.json({ success: true, data: constraint });
});

router.delete('/:id', async (req: Request, res: Response) => {
  await prisma.constraint.delete({ where: { id: param(req, 'id') } });
  res.json({ success: true, message: 'Constraint deleted' });
});

export default router;
