import { Request, Response, NextFunction } from 'express';
import { AuthError } from './errors';

/**
 * Get the authenticated user from the request, throwing an error if not authenticated
 */
export const getAuthUser = (req: Request) => {
  if (!req.user) {
    throw AuthError('User not authenticated');
  }
  return req.user;
};

/**
 * Middleware to ensure user is authenticated and attach to request
 * Use this as a route middleware before handlers that need req.user to be defined
 */
export const ensureAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(AuthError('User not authenticated'));
  }
  next();
};
