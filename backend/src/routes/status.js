import { Router } from 'express';
import { getIotService } from '../services/iot/index.js';
import { asyncHandler } from '../lib/asyncHandler.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    res.set('Cache-Control', 'no-store');
    const status = await getIotService().getStatus();
    res.json(status);
  })
);

export default router;
