import { Router } from 'express';
import { getIotService } from '../services/iot/index.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { commandLimiter } from '../middleware/rateLimits.js';
import { asyncHandler } from '../lib/asyncHandler.js';

const router = Router();

router.post(
  '/open',
  requireAuth,
  commandLimiter,
  asyncHandler(async (req, res) => {
    const result = await getIotService().openDoor();

    if (!result.accepted) {
      return res.status(409).json({
        error: {
          code: result.reason || 'DOOR_NOT_OPENED',
          message: result.message || 'La porte ne peut pas être ouverte.',
        },
      });
    }

    return res.status(result.simulated ? 200 : 202).json(result);
  })
);

export default router;
