import logger from './logger';

/**
 * Type-safe logger interface with structured metadata
 */

// Define common metadata types
export interface BaseLogMeta {
  [key: string]: any;
  traceId?: string;
}

export interface UserLogMeta extends BaseLogMeta {
  userId?: number;
  username?: string;
  email?: string;
}

export interface ErrorLogMeta extends BaseLogMeta {
  error?: Error | unknown;
  stack?: string;
}

export interface RequestLogMeta extends BaseLogMeta {
  method?: string;
  path?: string;
  statusCode?: number;
  duration?: number;
}

export interface EventLogMeta extends BaseLogMeta {
  eventId?: string;
  eventType?: string;
  actorId?: number;
  payload?: any;
}

// Type-safe logger wrapper
export const typeSafeLogger = {
  info: (message: string, meta?: BaseLogMeta) => {
    logger.info(message, meta);
  },

  warn: (message: string, meta?: BaseLogMeta) => {
    logger.warn(message, meta);
  },

  error: (message: string, meta?: ErrorLogMeta) => {
    logger.error(message, meta);
  },

  debug: (message: string, meta?: BaseLogMeta) => {
    logger.debug(message, meta);
  },

  // Domain-specific logging methods
  logUserAction: (message: string, meta: UserLogMeta) => {
    logger.info(message, meta);
  },

  logRequest: (message: string, meta: RequestLogMeta) => {
    logger.info(message, meta);
  },

  logError: (message: string, error: Error | unknown, meta?: BaseLogMeta) => {
    logger.error(message, { ...meta, error });
  },

  logEvent: (message: string, meta: EventLogMeta) => {
    logger.info(message, { ...meta, context_type: 'event' });
  },
};

export default typeSafeLogger;
