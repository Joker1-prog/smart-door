import rateLimit from 'express-rate-limit';

function jsonTooManyRequests(message) {
  return (req, res) => {
    res.status(429).json({ error: { code: 'RATE_LIMITED', message } });
  };
}

export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonTooManyRequests('Trop de requêtes. Réessayez dans une minute.'),
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonTooManyRequests('Trop de tentatives de connexion. Réessayez dans 15 minutes.'),
});

export const commandLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 12,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonTooManyRequests('Trop de commandes envoyées. Patientez une minute.'),
});

export const alarmLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonTooManyRequests('Trop de modifications de l’alarme. Patientez une minute.'),
});
