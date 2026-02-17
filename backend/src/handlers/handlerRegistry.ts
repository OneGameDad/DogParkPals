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
import { handleUserProfilePictureUploadedLogging } from './logging/onUserProfilePictureUploaded';
import { handleUserProfilePictureDeletedLogging } from './logging/onUserProfilePictureDeleted';
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
import { handleDogPhotoUploadedLogging } from './logging/onDogPhotoUploaded';
import { handleDogPhotoDeletedLogging } from './logging/onDogPhotoDeleted';
import { handleDogDocumentUploadedLogging } from './logging/onDogDocumentUploaded';
import { handleDogDocumentDeletedLogging } from './logging/onDogDocumentDeleted';
import { handleMessageSentNotifications } from './notifications/onMessageSent';
import { handleMessageSentLogging } from './logging/onMessageSent';
import { handleParkCheckedInLogging } from './logging/onParkCheckedIn';
import { handleParkCheckedOutLogging } from './logging/onParkCheckedOut';
import { handleParkAutoCheckedOutLogging } from './logging/onParkAutoCheckedOut';
import { handleEnemyAddedLogging } from './logging/onEnemyAdded';
import { handleEnemyRemovedLogging } from './logging/onEnemyRemoved';

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
  [EventTypes.UserProfilePictureUploaded]: [
    { name: 'logging.userProfilePictureUploaded', handler: handleUserProfilePictureUploadedLogging },
  ],
  [EventTypes.UserProfilePictureDeleted]: [
    { name: 'logging.userProfilePictureDeleted', handler: handleUserProfilePictureDeletedLogging },
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
  [EventTypes.DogPhotoUploaded]: [
    { name: 'logging.dogPhotoUploaded', handler: handleDogPhotoUploadedLogging },
  ],
  [EventTypes.DogPhotoDeleted]: [
    { name: 'logging.dogPhotoDeleted', handler: handleDogPhotoDeletedLogging },
  ],
  [EventTypes.DogDocumentUploaded]: [
    { name: 'logging.dogDocumentUploaded', handler: handleDogDocumentUploadedLogging },
  ],
  [EventTypes.DogDocumentDeleted]: [
    { name: 'logging.dogDocumentDeleted', handler: handleDogDocumentDeletedLogging },
  ],
  [EventTypes.MessageSent]: [
    { name: 'notifications.messageSent', handler: handleMessageSentNotifications },
    { name: 'logging.messageSent', handler: handleMessageSentLogging },
  ],
  [EventTypes.ParkCheckedIn]: [
    { name: 'logging.parkCheckedIn', handler: handleParkCheckedInLogging },
  ],
  [EventTypes.ParkCheckedOut]: [
    { name: 'logging.parkCheckedOut', handler: handleParkCheckedOutLogging },
  ],
  [EventTypes.ParkAutoCheckedOut]: [
    { name: 'logging.parkAutoCheckedOut', handler: handleParkAutoCheckedOutLogging },
  ],
  [EventTypes.EnemyAdded]: [
    { name: 'logging.enemyAdded', handler: handleEnemyAddedLogging },
  ],
  [EventTypes.EnemyRemoved]: [
    { name: 'logging.enemyRemoved', handler: handleEnemyRemovedLogging },
  ],
};
