import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config.js';
import { globalLimiter } from './middleware/rateLimits.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import healthRouter from './routes/health.js';
import statusRouter from './routes/status.js';
import eventsRouter from './routes/events.js';
import doorRouter from './routes/door.js';
import alarmRouter from './routes/alarm.js';
import authRouter from './routes/auth.js';

export function createApp() {
  const app = express();

  if (config.isProduction) {
    app.set('trust proxy', 1);
  }

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin: config.corsOrigins,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 86400,
    })
  );
  app.use(express.json({ limit: '16kb' }));
  app.use(globalLimiter);

  app.get('/', (req, res) => {
    res.json({
      name: 'SMART DOOR API',
      version: '1.0.0',
      mode: config.iotMode,
      endpoints: [
        'GET /api/health',
        'GET /api/status',
        'POST /api/auth/login',
        'POST /api/door/open (authentifié)',
        'POST /api/alarm (authentifié)',
        'GET /api/events',
      ],
    });
  });

  app.use('/api/health', healthRouter);
  app.use('/api/status', statusRouter);
  app.use('/api/events', eventsRouter);
  app.use('/api/door', doorRouter);
  app.use('/api/alarm', alarmRouter);
  app.use('/api/auth', authRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
