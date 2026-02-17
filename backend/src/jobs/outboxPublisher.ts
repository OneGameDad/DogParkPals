import { PrismaClient } from '@prisma/client';
import typeSafeLogger from '../utils/typeSafeLogger';
import { createQueueClient } from '../infrastructure/queue/queueFactory';
import { addOutboxEvent, isEventBusEnabled, listPendingOutboxEvents, markOutboxEventFailed, markOutboxEventPublished } from '../infrastructure/outbox/outboxRepository';
import type { DomainEventUnion } from '../events/eventTypes';
import { createDomainEvent } from '../events/createDomainEvent';
import { EventTypes } from '../events/eventTypes';

const prisma = new PrismaClient();
const queueClient = createQueueClient();

let isRunning = false;
let isProcessing = false;

async function processOutboxOnce(batchSize: number) {
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown publish error';
      await markOutboxEventFailed(prisma, record.id, message);
      typeSafeLogger.logError('Outbox publish failed', error, { eventId: record.id, eventType: record.type });

      const domainEvent = createDomainEvent(EventTypes.JobFailed, {
        jobName: 'outboxPublisher.publish',
        errorMessage: message,
        errorStack: error instanceof Error ? error.stack : undefined,
        context: { eventId: record.id, eventType: record.type },
      });
      await addOutboxEvent(prisma, domainEvent);
    }
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
    try {
      await processOutboxOnce(batchSize);
    } catch (error) {
      typeSafeLogger.logError('Outbox publisher cycle failed', error);
      const message = error instanceof Error ? error.message : 'Unknown publisher cycle error';
      const domainEvent = createDomainEvent(EventTypes.JobFailed, {
        jobName: 'outboxPublisher.cycle',
        errorMessage: message,
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      await addOutboxEvent(prisma, domainEvent);
    } finally {
      isProcessing = false;
    }
  }, intervalMs);
}
