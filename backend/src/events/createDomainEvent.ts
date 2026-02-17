import { randomUUID } from 'crypto';
import type { DomainEvent, EventPayloadMap, EventType } from './eventTypes';

export type CreateEventOptions = {
  actorId?: number;
  traceId?: string;
  occurredAt?: Date;
  version?: number;
};

export function createDomainEvent<TType extends EventType>(
  type: TType,
  payload: EventPayloadMap[TType],
  options: CreateEventOptions = {}
): DomainEvent<TType> {
  return {
    id: randomUUID(),
    type,
    occurredAt: (options.occurredAt ?? new Date()).toISOString(),
    actorId: options.actorId,
    payload,
    version: options.version ?? 1,
    traceId: options.traceId,
  };
}
