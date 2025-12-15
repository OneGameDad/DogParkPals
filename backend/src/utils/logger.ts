import { createLogger, format, transports } from 'winston';
import { sanitizeLogData } from './logSanitizer';

// Custom format to sanitize sensitive data from logs
const sanitizeFormat = format((info) => {
  // Sanitize the entire log entry except for core fields
  const { level, message, timestamp, service, ...meta } = info;
  const sanitizedMeta = sanitizeLogData(meta);
  
  return {
    level,
    message,
    timestamp,
    service,
    ...sanitizedMeta,
  };
})();

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    sanitizeFormat,
    format.json()
  ),
  defaultMeta: { service: 'backend' },
  transports: [
    new transports.Console({
      format:
        process.env.NODE_ENV === 'production'
          ? format.json()
          : format.combine(
              format.colorize(),
              format.timestamp(),
              format.printf(({ level, message, timestamp, ...meta }) => {
                const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
                return `${timestamp} [${level}]: ${message}${metaString}`;
              })
            ),
    }),
  ],
});

export default logger;
