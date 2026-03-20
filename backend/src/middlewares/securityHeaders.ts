import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to add security headers to all responses
 * Includes HSTS, X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, etc.
 */
export const securityHeaders = (_req: Request, res: Response, next: NextFunction) => {
  // HTTP Strict-Transport-Security (HSTS)
  // Forces browsers to use HTTPS for all future requests
  // max-age: 1 year (31536000 seconds), includeSubDomains for all subdomains
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // X-Content-Type-Options: Prevent MIME-type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // X-Frame-Options: Prevent clickjacking
  // DENY prevents the site from being framed by any site
  res.setHeader('X-Frame-Options', 'DENY');

  // X-XSS-Protection: Enable XSS protection in older browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Content-Security-Policy: Prevent inline scripts and restrict resource loading
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https:; frame-ancestors 'none'"
  );

  // Referrer-Policy: Control how much referrer information is shared
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions-Policy: Control browser features
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  next();
};
