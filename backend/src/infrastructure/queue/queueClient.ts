import type { DomainEventUnion } from '../../events/eventTypes';

export type QueueHandler = (event: DomainEventUnion) => Promise<void>;

export interface QueueClient {
  publish(event: DomainEventUnion): Promise<void>;
  subscribe(handler: QueueHandler): Promise<void>;
  close(): Promise<void>;
}
