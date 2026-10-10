import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const router = Router();

const UpdateSettingsSchema = z.object({
  daysPerWeek: z.number().int().min(1).max(7).optional(),
  hoursPerDay: z.number().int().min(1).max(12).optional(),
  maxConsecutiveSameSubject: z.boolean().optional(),
  maxConsecutiveHours: z.number().int().min(1).max(8).optional(),
});

async function getOrCreateSettings() {
  return prisma.schoolSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: { id: 'default' },
  });
}

router.get('/', async (_req: Request, res: Response) => {
  const settings = await getOrCreateSettings();
  res.json({ success: true, data: settings });
});

router.put('/', async (req: Request, res: Response) => {
  const parsed = UpdateSettingsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.flatten() });
    return;
  }

  await getOrCreateSettings();
  const settings = await prisma.schoolSettings.update({
    where: { id: 'default' },
    data: parsed.data,
  });
  res.json({ success: true, data: settings });
});

export default router;
