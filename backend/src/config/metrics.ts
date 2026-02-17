/**
 * Prometheus Metrics Configuration
 * 
 * Sets up the prom-client library with default Node.js metrics
 * and provides the registry for custom metrics.
 */

import { register, collectDefaultMetrics, Counter, Histogram } from 'prom-client';

// Collect default Node.js metrics (CPU, memory, event loop, etc.)
// scrape interval matches prometheus.yml (15s global, 10s for backend)
collectDefaultMetrics({
  register,
  prefix: 'dogparkpals_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
});

// Event handler execution counter
export const eventHandlerExecutions = new Counter({
  name: 'dogparkpals_event_handler_executions_total',
  help: 'Total number of event handler executions',
  labelNames: ['event_type', 'handler_name', 'status'],
  registers: [register],
});

// Event handler execution duration
export const eventHandlerDuration = new Histogram({
  name: 'dogparkpals_event_handler_duration_seconds',
  help: 'Event handler execution duration in seconds',
  labelNames: ['event_type', 'handler_name'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

// Background job metrics
export const jobExecutions = new Counter({
  name: 'dogparkpals_job_executions_total',
  help: 'Total number of background job executions',
  labelNames: ['job_name', 'status'],
  registers: [register],
});

export const jobDuration = new Histogram({
  name: 'dogparkpals_job_duration_seconds',
  help: 'Background job execution duration in seconds',
  labelNames: ['job_name'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10, 30],
  registers: [register],
});

export const outboxEventsPublished = new Counter({
  name: 'dogparkpals_outbox_events_published_total',
  help: 'Total number of outbox events published to queue',
  labelNames: ['event_type'],
  registers: [register],
});

export const outboxEventsFailed = new Counter({
  name: 'dogparkpals_outbox_events_failed_total',
  help: 'Total number of outbox events that failed to publish',
  labelNames: ['event_type'],
  registers: [register],
});

export const autoCheckouts = new Counter({
  name: 'dogparkpals_auto_checkouts_total',
  help: 'Total number of automatic park checkouts performed',
  registers: [register],
});

export { register };
