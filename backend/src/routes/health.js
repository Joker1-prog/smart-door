import { Router } from 'express';
import { config } from '../config.js';
import { checkDatabase } from '../lib/prisma.js';

const router = Router();

router.get('/', async (req, res) => {
  const startedAt = Date.now();
  let database = 'connected';

  try {
    await checkDatabase();
  } catch (error) {
    database = 'error';
    console.error('[health] Base de données indisponible:', error.message);
  }

  const healthy = database === 'connected';

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'error',
    database,
    mode: config.iotMode,
    uptimeSeconds: Math.round(process.uptime()),
    latencyMs: Date.now() - startedAt,
    timestamp: new Date().toISOString(),
  });
});

export default router;
