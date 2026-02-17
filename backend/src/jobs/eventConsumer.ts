import typeSafeLogger from '../utils/typeSafeLogger';
import { createQueueClient } from '../infrastructure/queue/queueFactory';
import { dispatchEvent } from '../handlers/dispatchEvent';

const queueClient = createQueueClient();

export async function startEventConsumer() {
  try {
    await queueClient.subscribe(dispatchEvent);
  } catch (error) {
    typeSafeLogger.logError('Failed to start event consumer', error);
  }
}
