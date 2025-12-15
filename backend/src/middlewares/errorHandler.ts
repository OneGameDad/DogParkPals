import { Request, Response, NextFunction } from 'express';
import { toAppError } from '../utils/errors';
import { buildErrorResponse } from '../utils/response';
import typeSafeLogger from '../utils/typeSafeLogger';

export const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) return next(err);

  const appError = toAppError(err, {
    message: 'Internal server error',
    code: 'INTERNAL_ERROR',
    statusCode: 500,
  });

  const statusCode = appError.statusCode ?? 500;
  const includeDetails = statusCode < 500;

  typeSafeLogger.logError('Request failed', err instanceof Error ? err : new Error(String(err)), {
    requestId: req.requestId,
    path: req.path,
    method: req.method,
    statusCode,
    code: appError.code,
  });

  return res.status(statusCode).json(
    buildErrorResponse(req, {
      error: appError.message,
      code: appError.code,
      details: includeDetails ? appError.details : undefined,
    })
  );
};
