import { connect, type Channel, type ChannelModel } from 'amqplib';
import type { DomainEventUnion } from '../../events/eventTypes';
import type { QueueClient, QueueHandler } from './queueClient';

const DEFAULT_QUEUE_NAME = 'dogpark.events';

export class RabbitMqClient implements QueueClient {
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private readonly queueName: string;
  private readonly dlqName: string;
  private readonly url: string;
  private readonly maxRetries: number;

  constructor(
    url: string,
    queueName = DEFAULT_QUEUE_NAME,
    options: { maxRetries?: number; dlqName?: string } = {}
  ) {
    this.url = url;
    this.queueName = queueName;
    this.dlqName = options.dlqName ?? `${queueName}.dlq`;
    this.maxRetries = options.maxRetries ?? 5;
  }

  private async ensureChannel() {
    if (this.channel) return;

    this.connection = await connect(this.url);
    const channel = await this.connection.createChannel();
    this.channel = channel;
    await channel.assertQueue(this.queueName, { durable: true });
    await channel.assertQueue(this.dlqName, { durable: true });
  }

  async publish(event: DomainEventUnion): Promise<void> {
    await this.ensureChannel();
    const payload = Buffer.from(JSON.stringify(event));
    this.channel?.sendToQueue(this.queueName, payload, { persistent: true });
  }

  async subscribe(handler: QueueHandler): Promise<void> {
    await this.ensureChannel();
    await this.channel?.consume(this.queueName, async (message) => {
      if (!message) return;
      try {
        const parsed = JSON.parse(message.content.toString()) as DomainEventUnion;
        await handler(parsed);
        this.channel?.ack(message);
      } catch (error) {
        const headers = message.properties.headers ?? {};
        const retries = Number(headers['x-retries'] ?? 0);
        if (retries >= this.maxRetries) {
          this.channel?.sendToQueue(this.dlqName, message.content, {
            persistent: true,
            headers: {
              ...headers,
              'x-retries': retries,
              'x-final-error': error instanceof Error ? error.message : 'Unknown error',
            },
          });
          this.channel?.ack(message);
          return;
        }

        this.channel?.sendToQueue(this.queueName, message.content, {
          persistent: true,
          headers: {
            ...headers,
            'x-retries': retries + 1,
          },
        });
        this.channel?.ack(message);
      }
    });
  }

  async close(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
    this.channel = null;
    this.connection = null;
  }
}
