import type { AchievementType, OrgRole, UserRole } from '@prisma/client';

export const EventTypes = {
  EventCreated: 'event.created',
  AchievementAwarded: 'achievement.awarded',
  UserRoleUpdated: 'user.role.updated',
  UserProfileUpdated: 'user.profile.updated',
  FriendRequestSent: 'friend.request.sent',
  FriendRequestAccepted: 'friend.request.accepted',
  OrganizationJoinRequested: 'organization.join.requested',
  OrganizationJoinApproved: 'organization.join.approved',
  OrganizationRoleUpdated: 'organization.role.updated',
  DogOwnershipAdded: 'dog.ownership.added',
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

export type EventPayloadMap = {
  [EventTypes.EventCreated]: EventCreatedPayload;
  [EventTypes.AchievementAwarded]: AchievementAwardedPayload;
  [EventTypes.UserRoleUpdated]: UserRoleUpdatedPayload;
  [EventTypes.UserProfileUpdated]: UserProfileUpdatedPayload;
  [EventTypes.FriendRequestSent]: FriendRequestSentPayload;
  [EventTypes.FriendRequestAccepted]: FriendRequestAcceptedPayload;
  [EventTypes.OrganizationJoinRequested]: OrganizationJoinRequestedPayload;
  [EventTypes.OrganizationJoinApproved]: OrganizationJoinApprovedPayload;
  [EventTypes.OrganizationRoleUpdated]: OrganizationRoleUpdatedPayload;
  [EventTypes.DogOwnershipAdded]: DogOwnershipAddedPayload;
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
