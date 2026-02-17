import type { DomainEventUnion } from '../../events/eventTypes';
import type { QueueClient, QueueHandler } from './queueClient';

export class InMemoryQueueClient implements QueueClient {
  private handlers: QueueHandler[] = [];

  async publish(event: DomainEventUnion): Promise<void> {
    for (const handler of this.handlers) {
      await handler(event);
    }
  }

  async subscribe(handler: QueueHandler): Promise<void> {
    this.handlers.push(handler);
  }

  async close(): Promise<void> {
    this.handlers = [];
  }
}
