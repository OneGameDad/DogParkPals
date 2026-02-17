import amqplib, { Channel, Connection } from 'amqplib';
import type { DomainEventUnion } from '../../events/eventTypes';
import type { QueueClient, QueueHandler } from './queueClient';

const DEFAULT_QUEUE_NAME = 'dogpark.events';

export class RabbitMqClient implements QueueClient {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private readonly queueName: string;
  private readonly url: string;

  constructor(url: string, queueName = DEFAULT_QUEUE_NAME) {
    this.url = url;
    this.queueName = queueName;
  }

  private async ensureChannel() {
    if (this.channel) return;

    this.connection = await amqplib.connect(this.url);
    this.channel = await this.connection.createChannel();
    await this.channel.assertQueue(this.queueName, { durable: true });
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
        this.channel?.nack(message, false, true);
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
