import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to enforce HTTPS by redirecting HTTP requests
 * Skips redirect if the connection is already HTTPS or if the app is in development mode
 * and using localhost (for testing)
 */
export const httpsRedirect = (req: Request, res: Response, next: NextFunction) => {
  // Skip redirect in development mode for localhost testing
  if (process.env.NODE_ENV === 'development' && req.hostname === 'localhost') {
    return next();
  }

  // Redirect HTTP to HTTPS
  if (req.protocol !== 'https' && process.env.NODE_ENV !== 'development') {
    const redirectUrl = `https://${req.get('host')}${req.originalUrl}`;
    return res.redirect(301, redirectUrl);
  }

  next();
};
