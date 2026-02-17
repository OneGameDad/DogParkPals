import { PrismaClient } from '@prisma/client';
import typeSafeLogger from '../utils/typeSafeLogger';
import type { DomainEventUnion } from '../events/eventTypes';
import { handlerRegistry } from './handlerRegistry';
import { eventHandlerExecutions, eventHandlerDuration } from '../config/metrics';

const prisma = new PrismaClient();

async function runHandlerWithIdempotency(
  handlerName: string,
  event: DomainEventUnion,
  handler: (event: DomainEventUnion) => Promise<void>
) {
  const existing = await prisma.processedEvent.findUnique({
    where: {
      eventId_handler: {
        eventId: event.id,
        handler: handlerName,
      },
    },
  });

  if (existing) {
    return;
  }

  await handler(event);
  await prisma.processedEvent.create({
    data: {
      eventId: event.id,
      handler: handlerName,
    },
  });
}

export async function dispatchEvent(event: DomainEventUnion) {
  const handlers = handlerRegistry[event.type] ?? [];
  for (const { name, handler } of handlers) {
    const startTime = Date.now();
    try {
      await runHandlerWithIdempotency(name, event, handler);
      
      // Record successful execution
      const duration = (Date.now() - startTime) / 1000;
      eventHandlerDuration.observe(
        { event_type: event.type, handler_name: name },
        duration
      );
      eventHandlerExecutions.inc({
        event_type: event.type,
        handler_name: name,
        status: 'success',
      });
    } catch (error) {
      // Record failed execution
      const duration = (Date.now() - startTime) / 1000;
      eventHandlerDuration.observe(
        { event_type: event.type, handler_name: name },
        duration
      );
      eventHandlerExecutions.inc({
        event_type: event.type,
        handler_name: name,
        status: 'failure',
      });
      
      typeSafeLogger.logError('Event handler failed', error, {
        eventId: event.id,
        eventType: event.type,
        handler: name,
      });
      throw error;
    }
  }
}
