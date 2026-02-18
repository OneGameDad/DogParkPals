/**
 * Event Audit Logging Handler
 * 
 * Logs all domain events to Elasticsearch via structured JSON logging.
 * This creates an immutable audit trail of all system events for compliance,
 * debugging, and business intelligence.
 */

import typeSafeLogger from '../../utils/typeSafeLogger';
import type { DomainEventUnion } from '../../events/eventTypes';

export async function handleEventAuditLogging(event: DomainEventUnion): Promise<void> {
  // Extract common fields from event
  const {
    id: eventId,
    type: eventType,
    occurredAt,
    actorId,
    traceId,
    version,
    payload,
  } = event;

  // Log event with structured metadata for Elasticsearch
  typeSafeLogger.logEvent(
    `Domain event: ${eventType}`,
    {
      eventId,
      eventType,
      occurredAt,
      actorId,
      traceId,
      version,
      payload,
      // Additional context for Kibana analysis
      event_source: 'domain_event',
      indexed_at: new Date().toISOString(),
    }
  );
}
