import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../lib/asyncHandler.js';

const router = Router();

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.string().trim().min(1).max(60).optional(),
});

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { limit, type } = querySchema.parse(req.query);

    const events = await prisma.doorEvent.findMany({
      where: type ? { eventType: type } : undefined,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
    });

    res.json({ events });
  })
);

export default router;
