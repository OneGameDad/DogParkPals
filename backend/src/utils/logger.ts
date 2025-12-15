import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
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
