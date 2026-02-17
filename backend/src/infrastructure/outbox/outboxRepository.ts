import type { PrismaClient } from '@prisma/client';
import type { DomainEventUnion } from '../../events/eventTypes';

export type PrismaClientOrTx = PrismaClient | Prisma.TransactionClient;

export function isEventBusEnabled() {
  return process.env.EVENT_BUS_ENABLED !== 'false';
}

export async function addOutboxEvent(client: PrismaClientOrTx, event: DomainEventUnion) {
  if (!isEventBusEnabled()) {
    return null;
  }
  return client.outboxEvent.create({
    data: {
      id: event.id,
      type: event.type,
      payload: event.payload,
      occurredAt: new Date(event.occurredAt),
      actorId: event.actorId ?? null,
      version: event.version,
      traceId: event.traceId ?? null,
    },
  });
}

export async function listPendingOutboxEvents(client: PrismaClientOrTx, limit: number) {
  return client.outboxEvent.findMany({
    where: { publishedAt: null },
    orderBy: { occurredAt: 'asc' },
    take: limit,
  });
}

export async function markOutboxEventPublished(client: PrismaClientOrTx, eventId: string) {
  return client.outboxEvent.update({
    where: { id: eventId },
    data: { publishedAt: new Date() },
  });
}

export async function markOutboxEventFailed(client: PrismaClientOrTx, eventId: string, errorMessage: string) {
  return client.outboxEvent.update({
    where: { id: eventId },
    data: {
      attempts: { increment: 1 },
      lastError: errorMessage,
    },
  });
}
