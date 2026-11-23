import { Router } from 'express';
import { z } from 'zod';
import { createSession, verifyAccessCode } from '../services/authService.js';
import { loginLimiter } from '../middleware/rateLimits.js';
import { asyncHandler } from '../lib/asyncHandler.js';

const router = Router();

const loginSchema = z.object({
  accessCode: z
    .string({ required_error: 'Le code d’accès est requis.' })
    .min(1, 'Le code d’accès est requis.')
    .max(200, 'Le code d’accès est trop long.'),
});

router.post(
  '/login',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const { accessCode } = loginSchema.parse(req.body);

    if (!verifyAccessCode(accessCode)) {
      return res.status(401).json({
        error: { code: 'INVALID_ACCESS_CODE', message: 'Code d’accès incorrect.' },
      });
    }

    const session = createSession();
    return res.json({
      token: session.token,
      expiresAt: session.expiresAt,
      message: 'Session ouverte. Vous pouvez commander la porte.',
    });
  })
);

export default router;
