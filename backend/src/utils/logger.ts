import { createLogger, format, transports } from 'winston';
import TransportStream from 'winston-transport';
import { sanitizeLogData } from './logSanitizer';
import * as dgram from 'dgram';

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

// Custom UDP transport for sending logs to Logstash
class UDPTransport extends TransportStream {
  private client: dgram.Socket;
  private host: string;
  private port: number;

  constructor(options?: any) {
    super(options);
    this.host = options?.host || 'localhost';
    this.port = options?.port || 5000;
    this.client = dgram.createSocket('udp4');
  }

  log(info: any, callback: () => void) {
    setImmediate(() => this.emit('logged', info));
    
    const message = JSON.stringify(info);
    const buffer = Buffer.from(message);

    this.client.send(buffer, 0, buffer.length, this.port, this.host, (err) => {
      if (err) {
        this.emit('error', err);
      }
      if (callback) callback();
    });
  }
}

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

// Add UDP transport to Logstash in production (when running in Docker)
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_LOGSTASH === 'true') {
  logger.add(
    new UDPTransport({
      host: process.env.LOGSTASH_HOST || 'logstash',
      port: parseInt(process.env.LOGSTASH_PORT || '5000'),
    })
  );
}

export default logger;
