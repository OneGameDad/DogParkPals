import type { AchievementType, OrgRole, UserRole } from '@prisma/client';

export const EventTypes = {
  EventCreated: 'event.created',
  EventAttended: 'event.attended',
  AchievementAwarded: 'achievement.awarded',
  UserRoleUpdated: 'user.role.updated',
  UserProfileUpdated: 'user.profile.updated',
  UserProfilePictureUploaded: 'user.profile.picture.uploaded',
  UserProfilePictureDeleted: 'user.profile.picture.deleted',
  FriendRequestSent: 'friend.request.sent',
  FriendRequestAccepted: 'friend.request.accepted',
  OrganizationJoinRequested: 'organization.join.requested',
  OrganizationJoinApproved: 'organization.join.approved',
  OrganizationRoleUpdated: 'organization.role.updated',
  OrganizationMemberRemoved: 'organization.member.removed',
  OrganizationDeleted: 'organization.deleted',
  DogOwnershipAdded: 'dog.ownership.added',
  DogOwnershipRemoved: 'dog.ownership.removed',
  DogCreated: 'dog.created',
  DogDeleted: 'dog.deleted',
  DogPhotoUploaded: 'dog.photo.uploaded',
  DogPhotoDeleted: 'dog.photo.deleted',
  DogDocumentUploaded: 'dog.document.uploaded',
  DogDocumentDeleted: 'dog.document.deleted',
  MessageSent: 'message.sent',
  ParkCheckedIn: 'park.checked_in',
  ParkCheckedOut: 'park.checked_out',
  ParkAutoCheckedOut: 'park.auto_checked_out',
  ParkDeleted: 'park.deleted',
  EnemyAdded: 'enemy.added',
  EnemyRemoved: 'enemy.removed',
  FriendRemoved: 'friend.removed',
  EventDeleted: 'event.deleted',
  JobFailed: 'job.failed',
  BackupStarted: 'backup.started',
  BackupSucceeded: 'backup.succeeded',
  BackupFailed: 'backup.failed',
} as const;

export type EventType = (typeof EventTypes)[keyof typeof EventTypes];

export type EventCreatedPayload = {
  eventId: number;
  parkId: number;
  organizerId: number;
  organizationId?: number | null;
  title: string;
};

export type EventAttendedPayload = {
  eventId: number;
  userId: number;
};

export type AchievementAwardedPayload = {
  userId: number;
  achievementId: number;
  name: string;
  type: AchievementType;
};

export type UserRoleUpdatedPayload = {
  targetUserId: number;
  role: UserRole;
  adminUserId: number;
};

export type UserProfileUpdatedPayload = {
  userId: number;
  fields: string[];
  updatedBy?: number;
  username?: string;
};

export type UserProfilePictureUploadedPayload = {
  userId: number;
  profilePictureUrl: string;
};

export type UserProfilePictureDeletedPayload = {
  userId: number;
  previousUrl: string;
};

export type FriendRequestSentPayload = {
  friendshipId: number;
  requesterId?: number | null;
  addresseeId?: number | null;
  requesterDogId?: number | null;
  addresseeDogId?: number | null;
};

export type FriendRequestAcceptedPayload = {
  friendshipId: number;
  requesterId?: number | null;
  addresseeId?: number | null;
};

export type OrganizationJoinRequestedPayload = {
  organizationId: number;
  requesterId: number;
};

export type OrganizationJoinApprovedPayload = {
  organizationId: number;
  userId: number;
  role: OrgRole;
};

export type OrganizationRoleUpdatedPayload = {
  organizationId: number;
  userId: number;
  role: OrgRole;
};

export type OrganizationMemberRemovedPayload = {
  organizationId: number;
  userId: number;
  removedBy?: number;
};

export type OrganizationDeletedPayload = {
  organizationId: number;
  memberIds: number[];
  deletedBy?: number;
};

export type DogOwnershipAddedPayload = {
  dogId: number;
  userId: number;
};

export type DogOwnershipRemovedPayload = {
  dogId: number;
  userId: number;
  removedBy?: number;
};

export type DogCreatedPayload = {
  dogId: number;
  name: string;
  ownerIds?: number[];
};

export type DogDeletedPayload = {
  dogId: number;
  name?: string;
  ownerIds: number[];
  deletedBy?: number;
};

export type DogPhotoUploadedPayload = {
  dogId: number;
  profilePictureUrl: string;
};

export type DogPhotoDeletedPayload = {
  dogId: number;
  previousUrl?: string | null;
};

export type DogDocumentUploadedPayload = {
  dogId: number;
  vaccinationRecordUrl: string;
};

export type DogDocumentDeletedPayload = {
  dogId: number;
  previousUrl?: string | null;
};

export type MessageSentPayload = {
  messageId: number;
  senderId: number;
  receiverId: number;
};

export type ParkCheckedInPayload = {
  checkInId: number;
  userId: number;
  parkId: number;
  dogId?: number | null;
};

export type ParkCheckedOutPayload = {
  checkInId: number;
  userId: number;
  parkId: number;
};

export type ParkAutoCheckedOutPayload = {
  checkInId: number;
  checkedOutAt: string;
};

export type ParkDeletedPayload = {
  parkId: number;
  name?: string;
  favoriteUserIds: number[];
  deletedBy?: number;
};

export type EnemyAddedPayload = {
  enemyId: number;
  ownerId: number;
  enemyUserId: number;
};

export type EnemyRemovedPayload = {
  ownerId: number;
  enemyUserId: number;
};

export type FriendRemovedPayload = {
  userId?: number | null;
  friendId?: number | null;
  dogId?: number | null;
  friendDogId?: number | null;
  removedBy?: number;
};

export type EventDeletedPayload = {
  eventId: number;
  organizerId?: number;
  organizationId?: number | null;
  parkId?: number | null;
  title?: string;
  attendeeIds: number[];
};

export type JobFailedPayload = {
  jobName: string;
  errorMessage: string;
  errorStack?: string;
  context?: Record<string, unknown>;
};

export type BackupStartedPayload = {
  backupId: string;
  target?: string;
  storage?: string;
};

export type BackupSucceededPayload = {
  backupId: string;
  target?: string;
  storage?: string;
  sizeBytes?: number;
  durationMs?: number;
};

export type BackupFailedPayload = {
  backupId: string;
  target?: string;
  storage?: string;
  errorMessage: string;
  errorStack?: string;
};

export type EventPayloadMap = {
  [EventTypes.EventCreated]: EventCreatedPayload;
  [EventTypes.EventAttended]: EventAttendedPayload;
  [EventTypes.AchievementAwarded]: AchievementAwardedPayload;
  [EventTypes.UserRoleUpdated]: UserRoleUpdatedPayload;
  [EventTypes.UserProfileUpdated]: UserProfileUpdatedPayload;
  [EventTypes.UserProfilePictureUploaded]: UserProfilePictureUploadedPayload;
  [EventTypes.UserProfilePictureDeleted]: UserProfilePictureDeletedPayload;
  [EventTypes.FriendRequestSent]: FriendRequestSentPayload;
  [EventTypes.FriendRequestAccepted]: FriendRequestAcceptedPayload;
  [EventTypes.OrganizationJoinRequested]: OrganizationJoinRequestedPayload;
  [EventTypes.OrganizationJoinApproved]: OrganizationJoinApprovedPayload;
  [EventTypes.OrganizationRoleUpdated]: OrganizationRoleUpdatedPayload;
  [EventTypes.OrganizationMemberRemoved]: OrganizationMemberRemovedPayload;
  [EventTypes.OrganizationDeleted]: OrganizationDeletedPayload;
  [EventTypes.DogOwnershipAdded]: DogOwnershipAddedPayload;
  [EventTypes.DogOwnershipRemoved]: DogOwnershipRemovedPayload;
  [EventTypes.DogCreated]: DogCreatedPayload;
  [EventTypes.DogDeleted]: DogDeletedPayload;
  [EventTypes.DogPhotoUploaded]: DogPhotoUploadedPayload;
  [EventTypes.DogPhotoDeleted]: DogPhotoDeletedPayload;
  [EventTypes.DogDocumentUploaded]: DogDocumentUploadedPayload;
  [EventTypes.DogDocumentDeleted]: DogDocumentDeletedPayload;
  [EventTypes.MessageSent]: MessageSentPayload;
  [EventTypes.ParkCheckedIn]: ParkCheckedInPayload;
  [EventTypes.ParkCheckedOut]: ParkCheckedOutPayload;
  [EventTypes.ParkAutoCheckedOut]: ParkAutoCheckedOutPayload;
  [EventTypes.ParkDeleted]: ParkDeletedPayload;
  [EventTypes.EnemyAdded]: EnemyAddedPayload;
  [EventTypes.EnemyRemoved]: EnemyRemovedPayload;
  [EventTypes.FriendRemoved]: FriendRemovedPayload;
  [EventTypes.EventDeleted]: EventDeletedPayload;
  [EventTypes.JobFailed]: JobFailedPayload;
  [EventTypes.BackupStarted]: BackupStartedPayload;
  [EventTypes.BackupSucceeded]: BackupSucceededPayload;
  [EventTypes.BackupFailed]: BackupFailedPayload;
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
