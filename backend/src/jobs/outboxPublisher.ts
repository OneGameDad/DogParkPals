import { PrismaClient } from '@prisma/client';
import typeSafeLogger from '../utils/typeSafeLogger';
import { createQueueClient } from '../infrastructure/queue/queueFactory';
import { listPendingOutboxEvents, markOutboxEventFailed, markOutboxEventPublished } from '../infrastructure/outbox/outboxRepository';
import type { DomainEventUnion } from '../events/eventTypes';

const prisma = new PrismaClient();
const queueClient = createQueueClient();

let isRunning = false;
let isProcessing = false;

async function processOutboxOnce(batchSize: number) {
  const pending = await listPendingOutboxEvents(prisma, batchSize);

  for (const record of pending) {
    try {
      const event: DomainEventUnion = {
        id: record.id,
        type: record.type as DomainEventUnion['type'],
        occurredAt: record.occurredAt.toISOString(),
        actorId: record.actorId ?? undefined,
        payload: record.payload as DomainEventUnion['payload'],
        version: record.version,
        traceId: record.traceId ?? undefined,
      };

      await queueClient.publish(event);
      await markOutboxEventPublished(prisma, record.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown publish error';
      await markOutboxEventFailed(prisma, record.id, message);
      typeSafeLogger.logError('Outbox publish failed', error, { eventId: record.id, eventType: record.type });
    }
  }
}

export function startOutboxPublisher(options: { intervalMs?: number; batchSize?: number } = {}) {
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
    } finally {
      isProcessing = false;
    }
  }, intervalMs);
}
