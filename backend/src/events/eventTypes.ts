import type { AchievementType } from '@prisma/client';

export const EventTypes = {
  EventCreated: 'event.created',
  AchievementAwarded: 'achievement.awarded',
} as const;

export type EventType = (typeof EventTypes)[keyof typeof EventTypes];

export type EventCreatedPayload = {
  eventId: number;
  parkId: number;
  organizerId: number;
  organizationId?: number | null;
  title: string;
};

export type AchievementAwardedPayload = {
  userId: number;
  achievementId: number;
  name: string;
  type: AchievementType;
};

export type EventPayloadMap = {
  [EventTypes.EventCreated]: EventCreatedPayload;
  [EventTypes.AchievementAwarded]: AchievementAwardedPayload;
};

export type DomainEvent<TType extends EventType = EventType> = {
  id: string;
  type: TType;
  occurredAt: string;
  actorId?: number;
  payload: EventPayloadMap[TType];
  version: number;
  traceId?: string;
};

export type DomainEventUnion = {
  [K in EventType]: DomainEvent<K>;
}[EventType];
