import type { AchievementType, OrgRole, UserRole } from '@prisma/client';

export const EventTypes = {
  EventCreated: 'event.created',
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
  DogOwnershipAdded: 'dog.ownership.added',
  DogPhotoUploaded: 'dog.photo.uploaded',
  DogPhotoDeleted: 'dog.photo.deleted',
  DogDocumentUploaded: 'dog.document.uploaded',
  DogDocumentDeleted: 'dog.document.deleted',
  MessageSent: 'message.sent',
  ParkCheckedIn: 'park.checked_in',
  ParkCheckedOut: 'park.checked_out',
  ParkAutoCheckedOut: 'park.auto_checked_out',
  EnemyAdded: 'enemy.added',
  EnemyRemoved: 'enemy.removed',
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

export type DogOwnershipAddedPayload = {
  dogId: number;
  userId: number;
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

export type EnemyAddedPayload = {
  enemyId: number;
  ownerId: number;
  enemyUserId: number;
};

export type EnemyRemovedPayload = {
  ownerId: number;
  enemyUserId: number;
};

export type EventPayloadMap = {
  [EventTypes.EventCreated]: EventCreatedPayload;
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
  [EventTypes.DogOwnershipAdded]: DogOwnershipAddedPayload;
  [EventTypes.DogPhotoUploaded]: DogPhotoUploadedPayload;
  [EventTypes.DogPhotoDeleted]: DogPhotoDeletedPayload;
  [EventTypes.DogDocumentUploaded]: DogDocumentUploadedPayload;
  [EventTypes.DogDocumentDeleted]: DogDocumentDeletedPayload;
  [EventTypes.MessageSent]: MessageSentPayload;
  [EventTypes.ParkCheckedIn]: ParkCheckedInPayload;
  [EventTypes.ParkCheckedOut]: ParkCheckedOutPayload;
  [EventTypes.ParkAutoCheckedOut]: ParkAutoCheckedOutPayload;
  [EventTypes.EnemyAdded]: EnemyAddedPayload;
  [EventTypes.EnemyRemoved]: EnemyRemovedPayload;
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
