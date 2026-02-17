/**
 * Prometheus Metrics Configuration
 * 
 * Sets up the prom-client library with default Node.js metrics
 * and provides the registry for custom metrics.
 */

import { register, collectDefaultMetrics } from 'prom-client';

// Collect default Node.js metrics (CPU, memory, event loop, etc.)
// scrape interval matches prometheus.yml (15s global, 10s for backend)
collectDefaultMetrics({
  register,
  prefix: 'dogparkpals_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
});

export { register };
