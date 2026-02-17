import type { DomainEventUnion, EventType } from '../events/eventTypes';
import { EventTypes } from '../events/eventTypes';
import { handleEventCreatedNotifications } from './notifications/onEventCreated';
import { handleEventCreatedLogging } from './logging/onEventCreated';
import { handleAchievementAwardedNotifications } from './notifications/onAchievementAwarded';
import { handleAchievementAwardedLogging } from './logging/onAchievementAwarded';
import { handleUserRoleUpdatedNotifications } from './notifications/onUserRoleUpdated';
import { handleUserRoleUpdatedLogging } from './logging/onUserRoleUpdated';
import { handleUserProfileUpdatedNotifications } from './notifications/onUserProfileUpdated';
import { handleUserProfileUpdatedLogging } from './logging/onUserProfileUpdated';
import { handleFriendRequestSentNotifications } from './notifications/onFriendRequestSent';
import { handleFriendRequestSentLogging } from './logging/onFriendRequestSent';
import { handleFriendRequestAcceptedNotifications } from './notifications/onFriendRequestAccepted';
import { handleFriendRequestAcceptedLogging } from './logging/onFriendRequestAccepted';
import { handleOrganizationJoinRequestedNotifications } from './notifications/onOrganizationJoinRequested';
import { handleOrganizationJoinRequestedLogging } from './logging/onOrganizationJoinRequested';
import { handleOrganizationJoinApprovedNotifications } from './notifications/onOrganizationJoinApproved';
import { handleOrganizationJoinApprovedLogging } from './logging/onOrganizationJoinApproved';
import { handleOrganizationRoleUpdatedNotifications } from './notifications/onOrganizationRoleUpdated';
import { handleOrganizationRoleUpdatedLogging } from './logging/onOrganizationRoleUpdated';
import { handleDogOwnershipAddedNotifications } from './notifications/onDogOwnershipAdded';
import { handleDogOwnershipAddedLogging } from './logging/onDogOwnershipAdded';
import { handleMessageSentNotifications } from './notifications/onMessageSent';
import { handleMessageSentLogging } from './logging/onMessageSent';

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
  [EventTypes.UserRoleUpdated]: [
    { name: 'notifications.userRoleUpdated', handler: handleUserRoleUpdatedNotifications },
    { name: 'logging.userRoleUpdated', handler: handleUserRoleUpdatedLogging },
  ],
  [EventTypes.UserProfileUpdated]: [
    { name: 'notifications.userProfileUpdated', handler: handleUserProfileUpdatedNotifications },
    { name: 'logging.userProfileUpdated', handler: handleUserProfileUpdatedLogging },
  ],
  [EventTypes.FriendRequestSent]: [
    { name: 'notifications.friendRequestSent', handler: handleFriendRequestSentNotifications },
    { name: 'logging.friendRequestSent', handler: handleFriendRequestSentLogging },
  ],
  [EventTypes.FriendRequestAccepted]: [
    { name: 'notifications.friendRequestAccepted', handler: handleFriendRequestAcceptedNotifications },
    { name: 'logging.friendRequestAccepted', handler: handleFriendRequestAcceptedLogging },
  ],
  [EventTypes.OrganizationJoinRequested]: [
    { name: 'notifications.organizationJoinRequested', handler: handleOrganizationJoinRequestedNotifications },
    { name: 'logging.organizationJoinRequested', handler: handleOrganizationJoinRequestedLogging },
  ],
  [EventTypes.OrganizationJoinApproved]: [
    { name: 'notifications.organizationJoinApproved', handler: handleOrganizationJoinApprovedNotifications },
    { name: 'logging.organizationJoinApproved', handler: handleOrganizationJoinApprovedLogging },
  ],
  [EventTypes.OrganizationRoleUpdated]: [
    { name: 'notifications.organizationRoleUpdated', handler: handleOrganizationRoleUpdatedNotifications },
    { name: 'logging.organizationRoleUpdated', handler: handleOrganizationRoleUpdatedLogging },
  ],
  [EventTypes.DogOwnershipAdded]: [
    { name: 'notifications.dogOwnershipAdded', handler: handleDogOwnershipAddedNotifications },
    { name: 'logging.dogOwnershipAdded', handler: handleDogOwnershipAddedLogging },
  ],
  [EventTypes.MessageSent]: [
    { name: 'notifications.messageSent', handler: handleMessageSentNotifications },
    { name: 'logging.messageSent', handler: handleMessageSentLogging },
  ],
};
