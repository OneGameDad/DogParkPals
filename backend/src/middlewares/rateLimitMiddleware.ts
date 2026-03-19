import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

const DEFAULT_AUTH_KEY = 'auth:anonymous';

export const getAuthRateLimitKey = (requestBody: unknown, anonymousKey: string = DEFAULT_AUTH_KEY): string => {

  if (!requestBody || typeof requestBody !== 'object') {
    return anonymousKey;
  }

  const { email } = requestBody as { email?: unknown };
  if (typeof email !== 'string') {
    return anonymousKey;
  }

  const normalizedEmail = email.trim().toLowerCase();
  return normalizedEmail.length > 0 ? `auth:${normalizedEmail}` : anonymousKey;
};

// Limit authentication attempts: 5 requests per 15 minutes per user identifier
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const anonymousFallbackKey = `${DEFAULT_AUTH_KEY}:${ipKeyGenerator(req.ip ?? '')}`;
    return getAuthRateLimitKey(req.body, anonymousFallbackKey);
  },
  message: 'Too many authentication attempts, please try again later.',
});
