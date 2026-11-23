import { Router } from 'express';
import { z } from 'zod';
import { getIotService } from '../services/iot/index.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { alarmLimiter } from '../middleware/rateLimits.js';
import { asyncHandler } from '../lib/asyncHandler.js';

const router = Router();

const alarmSchema = z.object({
  enabled: z.boolean({ required_error: 'Le champ enabled (booléen) est requis.' }),
});

router.post(
  '/',
  requireAuth,
  alarmLimiter,
  asyncHandler(async (req, res) => {
    const { enabled } = alarmSchema.parse(req.body);
    const result = await getIotService().setAlarm(enabled);
    res.json(result);
  })
);

export default router;
