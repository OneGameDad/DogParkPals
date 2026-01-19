import { Request, Response, NextFunction } from 'express';

/**
 * Mock middleware that allows all requests to pass through
 * Used in tests to bypass requireAuth middleware
 */
export const mockRequireAuth = (req: Request, res: Response, next: NextFunction) => {
  // Set a mock user on the request so authenticated routes work
  (req as any).userId = 1;
  next();
};
