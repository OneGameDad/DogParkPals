import type { DomainEventUnion, EventType } from '../events/eventTypes';
import { EventTypes } from '../events/eventTypes';
import { handleEventCreatedNotifications } from './notifications/onEventCreated';
import { handleEventCreatedLogging } from './logging/onEventCreated';
import { handleAchievementAwardedNotifications } from './notifications/onAchievementAwarded';
import { handleAchievementAwardedLogging } from './logging/onAchievementAwarded';

export type EventHandler = (event: DomainEventUnion) => Promise<void>;

export type RegisteredHandler = {
  name: string;
  handler: EventHandler;
};

export const handlerRegistry: Record<EventType, RegisteredHandler[]> = {
  [EventTypes.EventCreated]: [
    { name: 'notifications.eventCreated', handler: handleEventCreatedNotifications },
    { name: 'logging.eventCreated', handler: handleEventCreatedLogging },
  ],
  [EventTypes.AchievementAwarded]: [
    { name: 'notifications.achievementAwarded', handler: handleAchievementAwardedNotifications },
    { name: 'logging.achievementAwarded', handler: handleAchievementAwardedLogging },
  ],
};
