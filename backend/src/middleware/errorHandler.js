import { ZodError } from 'zod';

export function notFound(req, res) {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route introuvable : ${req.method} ${req.originalUrl}`,
    },
  });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Données invalides.',
        details: error.issues.map((issue) => ({
          path: issue.path.join('.') || '(racine)',
          message: issue.message,
        })),
      },
    });
  }

  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      error: { code: 'INVALID_JSON', message: 'Corps de requête JSON invalide.' },
    });
  }

  const status = Number.isInteger(error.status) ? error.status : 500;
  if (status >= 500) {
    console.error('[api]', error);
  }

  return res.status(status).json({
    error: {
      code: error.code || (status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR'),
      message:
        status >= 500 && !error.expose
          ? 'Erreur interne du serveur.'
          : error.message || 'Erreur de requête.',
      ...(error.details ? { details: error.details } : {}),
    },
  });
}
