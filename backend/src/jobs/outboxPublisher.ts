import { PrismaClient } from '@prisma/client';
import typeSafeLogger from '../utils/typeSafeLogger';
import { createQueueClient } from '../infrastructure/queue/queueFactory';
import { addOutboxEvent, isEventBusEnabled, listPendingOutboxEvents, markOutboxEventFailed, markOutboxEventPublished } from '../infrastructure/outbox/outboxRepository';
import type { DomainEventUnion } from '../events/eventTypes';
import { createDomainEvent } from '../events/createDomainEvent';
import { EventTypes } from '../events/eventTypes';
import { outboxEventsPublished, outboxEventsFailed, jobExecutions, jobDuration } from '../config/metrics';

const prisma = new PrismaClient();
const queueClient = createQueueClient();

let isRunning = false;
let isProcessing = false;

async function processOutboxOnce(batchSize: number) {
  try {
    const pending = await listPendingOutboxEvents(prisma, batchSize);

    for (const record of pending) {
      try {
        const event = {
          id: record.id,
          type: record.type,
          occurredAt: record.occurredAt.toISOString(),
          actorId: record.actorId ?? undefined,
          payload: record.payload,
          version: record.version,
          traceId: record.traceId ?? undefined,
        } as DomainEventUnion;

        await queueClient.publish(event);
        await markOutboxEventPublished(prisma, record.id);
        
        // Track successful publish
        outboxEventsPublished.inc({ event_type: record.type });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown publish error';
        try {
          await markOutboxEventFailed(prisma, record.id, message);
        } catch (markError) {
          typeSafeLogger.logError('Could not mark outbox event as failed', markError, { eventId: record.id });
        }
        typeSafeLogger.logError('Outbox publish failed', error, { eventId: record.id, eventType: record.type });

        // Track failed publish
        outboxEventsFailed.inc({ event_type: record.type });

        const domainEvent = createDomainEvent(EventTypes.JobFailed, {
          jobName: 'outboxPublisher.publish',
          errorMessage: message,
          errorStack: error instanceof Error ? error.stack : undefined,
          context: { eventId: record.id, eventType: record.type },
        });
        try {
          await addOutboxEvent(prisma, domainEvent);
        } catch (addError) {
          // Silently fail - error was already logged above
          typeSafeLogger.debug('Could not record publish failure event', { cause: addError });
        }
      }
    }
  } catch (error) {
    // If we can't even fetch pending events (database issue), log it but don't crash
    const message = error instanceof Error ? error.message : 'Unknown fetch error';
    typeSafeLogger.logError('Outbox: Could not fetch pending events', error, { message });
    // Re-throw to let the caller handle it
    throw error;
  }
}

export function startOutboxPublisher(options: { intervalMs?: number; batchSize?: number } = {}) {
  if (!isEventBusEnabled()) {
    typeSafeLogger.info('Outbox publisher disabled by EVENT_BUS_ENABLED');
    return;
  }
  const intervalMs = options.intervalMs ?? 2000;
  const batchSize = options.batchSize ?? 25;

  if (isRunning) return;
  isRunning = true;

  setInterval(async () => {
    if (!isRunning) return;
    if (isProcessing) return;
    isProcessing = true;
    const startTime = Date.now();
    try {
      await processOutboxOnce(batchSize);
      
      // Track successful cycle
      const duration = (Date.now() - startTime) / 1000;
      jobDuration.observe({ job_name: 'outboxPublisher' }, duration);
      jobExecutions.inc({ job_name: 'outboxPublisher', status: 'success' });
    } catch (error) {
      // Track failed cycle
      const duration = (Date.now() - startTime) / 1000;
      jobDuration.observe({ job_name: 'outboxPublisher' }, duration);
      jobExecutions.inc({ job_name: 'outboxPublisher', status: 'failure' });
      
      typeSafeLogger.logError('Outbox publisher cycle failed', error);
      const message = error instanceof Error ? error.message : 'Unknown publisher cycle error';
      
      // Try to record the failure, but don't crash if we can't
      try {
        const domainEvent = createDomainEvent(EventTypes.JobFailed, {
          jobName: 'outboxPublisher.cycle',
          errorMessage: message,
          errorStack: error instanceof Error ? error.stack : undefined,
        });
        await addOutboxEvent(prisma, domainEvent);
      } catch (recordError) {
        // Silently fail to record error - at least it was logged above
        typeSafeLogger.debug('Could not record job failure event', { cause: recordError });
      }
    } finally {
      isProcessing = false;
    }
  }, intervalMs);
}
