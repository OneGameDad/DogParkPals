import typeSafeLogger from '../utils/typeSafeLogger';
import { createQueueClient } from '../infrastructure/queue/queueFactory';
import { dispatchEvent } from '../handlers/dispatchEvent';
import { PrismaClient } from '@prisma/client';
import { isEventBusEnabled, addOutboxEvent } from '../infrastructure/outbox/outboxRepository';
import { createDomainEvent } from '../events/createDomainEvent';
import { EventTypes } from '../events/eventTypes';
import { jobExecutions } from '../config/metrics';

const queueClient = createQueueClient();
const prisma = new PrismaClient();

export async function startEventConsumer() {
  if (!isEventBusEnabled()) {
    typeSafeLogger.info('Event consumer disabled by EVENT_BUS_ENABLED');
    return;
  }
  try {
    await queueClient.subscribe(dispatchEvent);
    jobExecutions.inc({ job_name: 'eventConsumer', status: 'started' });
  } catch (error) {
    jobExecutions.inc({ job_name: 'eventConsumer', status: 'failure' });
    typeSafeLogger.logError('Failed to start event consumer', error);
    const message = error instanceof Error ? error.message : 'Unknown event consumer error';
    const domainEvent = createDomainEvent(EventTypes.JobFailed, {
      jobName: 'eventConsumer.start',
      errorMessage: message,
      errorStack: error instanceof Error ? error.stack : undefined,
    });
    await addOutboxEvent(prisma, domainEvent);
  }
}
