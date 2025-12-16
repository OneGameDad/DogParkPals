import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const incomingId = req.headers['x-request-id'] as string | undefined;
  const requestId = incomingId || randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};
