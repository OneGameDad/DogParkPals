import { InMemoryQueueClient } from './inMemoryQueueClient';
import { RabbitMqClient } from './rabbitmqClient';
import type { QueueClient } from './queueClient';

const DEFAULT_QUEUE_NAME = 'dogpark.events';

export function createQueueClient(): QueueClient {
  const driver = process.env.EVENTS_DRIVER ?? (process.env.NODE_ENV === 'test' ? 'inmemory' : 'rabbitmq');

  if (driver === 'inmemory') {
    return new InMemoryQueueClient();
  }

  const url = process.env.RABBITMQ_URL ?? 'amqp://localhost:5672';
  const queueName = process.env.EVENT_QUEUE_NAME ?? DEFAULT_QUEUE_NAME;
  return new RabbitMqClient(url, queueName);
}
