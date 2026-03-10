import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to enforce HTTPS by redirecting HTTP requests
 * Skips redirect in development/test environments or when using localhost
 */
export const httpsRedirect = (req: Request, res: Response, next: NextFunction) => {
  const env = process.env.NODE_ENV;
  
  // Skip redirect in development or test environments
  if (env === 'development' || env === 'test') {
    return next();
  }

  // Skip redirect for localhost (useful for local testing with supertest)
  if (req.hostname === 'localhost' || req.hostname === '127.0.0.1') {
    return next();
  }

  // Redirect HTTP to HTTPS in production
  if (req.protocol !== 'https') {
    const redirectUrl = `https://${req.get('host')}${req.originalUrl}`;
    return res.redirect(301, redirectUrl);
  }

  next();
};
