import fs from 'fs';
import { InMemoryQueueClient } from './inMemoryQueueClient';
import { RabbitMqClient } from './rabbitmqClient';
import type { QueueClient } from './queueClient';

const DEFAULT_QUEUE_NAME = 'dogpark.events';

export function createQueueClient(): QueueClient {
  const driver = process.env.EVENTS_DRIVER ?? (process.env.NODE_ENV === 'test' ? 'inmemory' : 'rabbitmq');

  if (driver === 'inmemory') {
    return new InMemoryQueueClient();
  }

  const url = process.env.RABBITMQ_URL ?? 'amqps://localhost:5671';
  const queueName = process.env.EVENT_QUEUE_NAME ?? DEFAULT_QUEUE_NAME;
  const maxRetries = Number(process.env.EVENT_QUEUE_MAX_RETRIES ?? 5);
  const dlqName = process.env.EVENT_QUEUE_DLQ_NAME;

  let connectionOptions: Record<string, unknown> | undefined;

  if (url.startsWith('amqps://')) {
    const skipVerify = (process.env.RABBIT_SKIP_VERIFY ?? 'false').toLowerCase() === 'true';
    const caPath = process.env.RABBITMQ_CA_PATH ?? '/app/certs/rabbitmq.crt';

    connectionOptions = {
      rejectUnauthorized: !skipVerify,
    };

    if (!skipVerify) {
      if (!fs.existsSync(caPath)) {
        throw new Error(`RABBITMQ_CA_PATH does not exist: ${caPath}`);
      }
      connectionOptions = {
        ...connectionOptions,
        ca: [fs.readFileSync(caPath)],
      };
    }
  }

  return new RabbitMqClient(url, queueName, {
    maxRetries,
    dlqName,
    connectionOptions,
  });
}
