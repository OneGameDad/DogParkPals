import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, AuthError } from '../utils/errors';
import { UserRole } from '@prisma/client';

// Middleware factory to enforce required roles
export const requireRole = (...allowed: Array<UserRole | string>) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!role) {
      return next(AuthError('Authentication token required'));
    }

    if (!allowed.includes(role)) {
      return next(ForbiddenError('Insufficient permissions'));
    }

    next();
  };
};
