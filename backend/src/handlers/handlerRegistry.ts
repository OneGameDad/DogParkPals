import type { DomainEventUnion, EventType } from '../events/eventTypes';
import { EventTypes } from '../events/eventTypes';
import { handleEventCreatedNotifications } from './notifications/onEventCreated';
import { handleEventCreatedLogging } from './logging/onEventCreated';
import { handleEventAttendedAchievements } from './achievements/onEventAttended';
import { handleAchievementAwardedNotifications } from './notifications/onAchievementAwarded';
import { handleAchievementAwardedLogging } from './logging/onAchievementAwarded';
import { handleUserRoleUpdatedNotifications } from './notifications/onUserRoleUpdated';
import { handleUserRoleUpdatedLogging } from './logging/onUserRoleUpdated';
import { handleUserProfileUpdatedNotifications } from './notifications/onUserProfileUpdated';
import { handleUserProfileUpdatedLogging } from './logging/onUserProfileUpdated';
import { handleUserProfilePictureUploadedNotifications } from './notifications/onUserProfilePictureUploaded';
import { handleUserProfilePictureDeletedNotifications } from './notifications/onUserProfilePictureDeleted';
import { handleUserProfilePictureUploadedLogging } from './logging/onUserProfilePictureUploaded';
import { handleUserProfilePictureDeletedLogging } from './logging/onUserProfilePictureDeleted';
import { handleFriendRequestSentNotifications } from './notifications/onFriendRequestSent';
import { handleFriendRequestSentLogging } from './logging/onFriendRequestSent';
import { handleFriendRequestAcceptedNotifications } from './notifications/onFriendRequestAccepted';
import { handleFriendRequestAcceptedLogging } from './logging/onFriendRequestAccepted';
import { handleFriendRequestAcceptedAchievements } from './achievements/onFriendRequestAccepted';
import { handleOrganizationJoinRequestedNotifications } from './notifications/onOrganizationJoinRequested';
import { handleOrganizationJoinRequestedLogging } from './logging/onOrganizationJoinRequested';
import { handleOrganizationJoinApprovedNotifications } from './notifications/onOrganizationJoinApproved';
import { handleOrganizationJoinApprovedLogging } from './logging/onOrganizationJoinApproved';
import { handleOrganizationJoinApprovedAchievements } from './achievements/onOrganizationJoinApproved';
import { handleOrganizationRoleUpdatedNotifications } from './notifications/onOrganizationRoleUpdated';
import { handleOrganizationRoleUpdatedLogging } from './logging/onOrganizationRoleUpdated';
import { handleOrganizationMemberRemovedNotifications } from './notifications/onOrganizationMemberRemoved';
import { handleOrganizationDeletedNotifications } from './notifications/onOrganizationDeleted';
import { handleDogOwnershipAddedNotifications } from './notifications/onDogOwnershipAdded';
import { handleDogOwnershipAddedLogging } from './logging/onDogOwnershipAdded';
import { handleDogOwnershipAddedAchievements } from './achievements/onDogOwnershipAdded';
import { handleDogOwnershipRemovedNotifications } from './notifications/onDogOwnershipRemoved';
import { handleDogCreatedNotifications } from './notifications/onDogCreated';
import { handleDogDeletedNotifications } from './notifications/onDogDeleted';
import { handleDogPhotoUploadedNotifications } from './notifications/onDogPhotoUploaded';
import { handleDogPhotoDeletedNotifications } from './notifications/onDogPhotoDeleted';
import { handleDogPhotoUploadedLogging } from './logging/onDogPhotoUploaded';
import { handleDogPhotoDeletedLogging } from './logging/onDogPhotoDeleted';
import { handleDogDocumentUploadedLogging } from './logging/onDogDocumentUploaded';
import { handleDogDocumentDeletedLogging } from './logging/onDogDocumentDeleted';
import { handleMessageSentNotifications } from './notifications/onMessageSent';
import { handleMessageSentLogging } from './logging/onMessageSent';
import { handleParkCheckedInLogging } from './logging/onParkCheckedIn';
import { handleParkCheckedOutLogging } from './logging/onParkCheckedOut';
import { handleParkAutoCheckedOutLogging } from './logging/onParkAutoCheckedOut';
import { handleParkCheckedInNotifications } from './notifications/onParkCheckedIn';
import { handleParkDeletedNotifications } from './notifications/onParkDeleted';
import { handleEventDeletedNotifications } from './notifications/onEventDeleted';
import { handleEnemyAddedLogging } from './logging/onEnemyAdded';
import { handleEnemyAddedAchievements } from './achievements/onEnemyAdded';
import { handleEnemyRemovedLogging } from './logging/onEnemyRemoved';
import { handleEnemyRemovedNotifications } from './notifications/onEnemyRemoved';
import { handleFriendRemovedNotifications } from './notifications/onFriendRemoved';
import { handleJobFailedLogging } from './logging/onJobFailed';
import { handleBackupStartedLogging } from './logging/onBackupStarted';
import { handleBackupSucceededLogging } from './logging/onBackupSucceeded';
import { handleBackupFailedLogging } from './logging/onBackupFailed';

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
  [EventTypes.EventAttended]: [
    { name: 'achievements.eventAttended', handler: handleEventAttendedAchievements },
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
    { name: 'notifications.userProfilePictureUploaded', handler: handleUserProfilePictureUploadedNotifications },
    { name: 'logging.userProfilePictureUploaded', handler: handleUserProfilePictureUploadedLogging },
  ],
  [EventTypes.UserProfilePictureDeleted]: [
    { name: 'notifications.userProfilePictureDeleted', handler: handleUserProfilePictureDeletedNotifications },
    { name: 'logging.userProfilePictureDeleted', handler: handleUserProfilePictureDeletedLogging },
  ],
  [EventTypes.FriendRequestSent]: [
    { name: 'notifications.friendRequestSent', handler: handleFriendRequestSentNotifications },
    { name: 'logging.friendRequestSent', handler: handleFriendRequestSentLogging },
  ],
  [EventTypes.FriendRequestAccepted]: [
    { name: 'notifications.friendRequestAccepted', handler: handleFriendRequestAcceptedNotifications },
    { name: 'achievements.friendRequestAccepted', handler: handleFriendRequestAcceptedAchievements },
    { name: 'logging.friendRequestAccepted', handler: handleFriendRequestAcceptedLogging },
  ],
  [EventTypes.OrganizationJoinRequested]: [
    { name: 'notifications.organizationJoinRequested', handler: handleOrganizationJoinRequestedNotifications },
    { name: 'logging.organizationJoinRequested', handler: handleOrganizationJoinRequestedLogging },
  ],
  [EventTypes.OrganizationJoinApproved]: [
    { name: 'notifications.organizationJoinApproved', handler: handleOrganizationJoinApprovedNotifications },
    { name: 'achievements.organizationJoinApproved', handler: handleOrganizationJoinApprovedAchievements },
    { name: 'logging.organizationJoinApproved', handler: handleOrganizationJoinApprovedLogging },
  ],
  [EventTypes.OrganizationRoleUpdated]: [
    { name: 'notifications.organizationRoleUpdated', handler: handleOrganizationRoleUpdatedNotifications },
    { name: 'logging.organizationRoleUpdated', handler: handleOrganizationRoleUpdatedLogging },
  ],
  [EventTypes.OrganizationMemberRemoved]: [
    { name: 'notifications.organizationMemberRemoved', handler: handleOrganizationMemberRemovedNotifications },
  ],
  [EventTypes.OrganizationDeleted]: [
    { name: 'notifications.organizationDeleted', handler: handleOrganizationDeletedNotifications },
  ],
  [EventTypes.DogOwnershipAdded]: [
    { name: 'notifications.dogOwnershipAdded', handler: handleDogOwnershipAddedNotifications },
    { name: 'achievements.dogOwnershipAdded', handler: handleDogOwnershipAddedAchievements },
    { name: 'logging.dogOwnershipAdded', handler: handleDogOwnershipAddedLogging },
  ],
  [EventTypes.DogOwnershipRemoved]: [
    { name: 'notifications.dogOwnershipRemoved', handler: handleDogOwnershipRemovedNotifications },
  ],
  [EventTypes.DogCreated]: [
    { name: 'notifications.dogCreated', handler: handleDogCreatedNotifications },
  ],
  [EventTypes.DogDeleted]: [
    { name: 'notifications.dogDeleted', handler: handleDogDeletedNotifications },
  ],
  [EventTypes.DogPhotoUploaded]: [
    { name: 'notifications.dogPhotoUploaded', handler: handleDogPhotoUploadedNotifications },
    { name: 'logging.dogPhotoUploaded', handler: handleDogPhotoUploadedLogging },
  ],
  [EventTypes.DogPhotoDeleted]: [
    { name: 'notifications.dogPhotoDeleted', handler: handleDogPhotoDeletedNotifications },
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
    { name: 'notifications.parkCheckedIn', handler: handleParkCheckedInNotifications },
    { name: 'logging.parkCheckedIn', handler: handleParkCheckedInLogging },
  ],
  [EventTypes.ParkCheckedOut]: [
    { name: 'logging.parkCheckedOut', handler: handleParkCheckedOutLogging },
  ],
  [EventTypes.ParkAutoCheckedOut]: [
    { name: 'logging.parkAutoCheckedOut', handler: handleParkAutoCheckedOutLogging },
  ],
  [EventTypes.ParkDeleted]: [
    { name: 'notifications.parkDeleted', handler: handleParkDeletedNotifications },
  ],
  [EventTypes.EventDeleted]: [
    { name: 'notifications.eventDeleted', handler: handleEventDeletedNotifications },
  ],
  [EventTypes.EnemyAdded]: [
    { name: 'achievements.enemyAdded', handler: handleEnemyAddedAchievements },
    { name: 'logging.enemyAdded', handler: handleEnemyAddedLogging },
  ],
  [EventTypes.EnemyRemoved]: [
    { name: 'notifications.enemyRemoved', handler: handleEnemyRemovedNotifications },
    { name: 'logging.enemyRemoved', handler: handleEnemyRemovedLogging },
  ],
  [EventTypes.FriendRemoved]: [
    { name: 'notifications.friendRemoved', handler: handleFriendRemovedNotifications },
  ],
  [EventTypes.JobFailed]: [
    { name: 'logging.jobFailed', handler: handleJobFailedLogging },
  ],
  [EventTypes.BackupStarted]: [
    { name: 'logging.backupStarted', handler: handleBackupStartedLogging },
  ],
  [EventTypes.BackupSucceeded]: [
    { name: 'logging.backupSucceeded', handler: handleBackupSucceededLogging },
  ],
  [EventTypes.BackupFailed]: [
    { name: 'logging.backupFailed', handler: handleBackupFailedLogging },
  ],
};
