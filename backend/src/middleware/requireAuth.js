import { isValidSession } from '../services/authService.js';

export function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const [scheme, token] = header.split(' ');

  if (!token || scheme.toLowerCase() !== 'bearer') {
    return res.status(401).json({
      error: {
        code: 'AUTH_REQUIRED',
        message: 'Un jeton de session est requis. Connectez-vous avec le code d’accès.',
      },
    });
  }

  if (!isValidSession(token)) {
    return res.status(401).json({
      error: {
        code: 'INVALID_SESSION',
        message: 'Session expirée ou invalide. Saisissez à nouveau le code d’accès.',
      },
    });
  }

  req.sessionToken = token;
  return next();
}
