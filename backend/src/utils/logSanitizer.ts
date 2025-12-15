/**
 * Sanitizes log metadata by removing sensitive fields
 * This prevents passwords, tokens, and other secrets from appearing in logs
 */
export const sanitizeLogData = (data: any): any => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  // If it's an array, sanitize each item
  if (Array.isArray(data)) {
    return data.map(sanitizeLogData);
  }

  // Handle Date objects specially - return as-is
  if (data instanceof Date) {
    return data;
  }

  // Handle Error objects specially - return as-is
  if (data instanceof Error) {
    return data;
  }

  // Clone the object to avoid mutating the original
  const sanitized: any = {};

  // List of sensitive field names to exclude (normalized without underscores/dashes)
  const sensitiveFields = [
    'password',
    'passwordhash',
    'newpassword',
    'oldpassword',
    'confirmpassword',
    'token',
    'accesstoken',
    'refreshtoken',
    'apikey',
    'secret',
    'privatekey',
    'creditcard',
    'ssn',
    'socialsecuritynumber',
  ];

  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      // Normalize key by removing underscores, dashes, and converting to lowercase
      const normalizedKey = key.toLowerCase().replace(/[_-]/g, '');
      
      // Check if this key should be filtered
      if (sensitiveFields.some(field => normalizedKey.includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof data[key] === 'object' && data[key] !== null) {
        // Recursively sanitize nested objects
        sanitized[key] = sanitizeLogData(data[key]);
      } else {
        sanitized[key] = data[key];
      }
    }
  }

  return sanitized;
};
