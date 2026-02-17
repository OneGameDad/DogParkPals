import { describe, beforeEach, test, expect, jest } from '@jest/globals';
import { NotificationType } from '@prisma/client';
import { EventTypes } from '../events/eventTypes';

const mockNotificationService = {
  createNotification: jest.fn(),
  createNotifications: jest.fn(),
};

const mockPrisma = {
  dogOwner: {
    findMany: jest.fn(),
  },
  organizationMember: {
    findMany: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
  },
};

jest.mock('../services/notificationService', () => ({
  __esModule: true,
  default: mockNotificationService,
}));

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
  NotificationType: {
    FRIENDSHIP_REQUEST: 'FRIENDSHIP_REQUEST',
    FRIENDSHIP_ACCEPTED: 'FRIENDSHIP_ACCEPTED',
    DOG_OWNERSHIP_ADDED: 'DOG_OWNERSHIP_ADDED',
    DOG_OWNERSHIP_REMOVED: 'DOG_OWNERSHIP_REMOVED',
    DOG_CREATED: 'DOG_CREATED',
    DOG_DELETED: 'DOG_DELETED',
    ORGANIZATION_JOIN_REQUEST: 'ORGANIZATION_JOIN_REQUEST',
    ORGANIZATION_JOIN_APPROVED: 'ORGANIZATION_JOIN_APPROVED',
    ORGANIZATION_ROLE_UPDATED: 'ORGANIZATION_ROLE_UPDATED',
    ORGANIZATION_MEMBER_REMOVED: 'ORGANIZATION_MEMBER_REMOVED',
    ORGANIZATION_DELETED: 'ORGANIZATION_DELETED',
    USER_ROLE_UPDATED: 'USER_ROLE_UPDATED',
    PROFILE_UPDATED: 'PROFILE_UPDATED',
    USER_PHOTO_UPLOADED: 'USER_PHOTO_UPLOADED',
    USER_PHOTO_REMOVED: 'USER_PHOTO_REMOVED',
    MESSAGE_RECEIVED: 'MESSAGE_RECEIVED',
    EVENT_INVITATION: 'EVENT_INVITATION',
    EVENT_CREATED: 'EVENT_CREATED',
    EVENT_REMINDER: 'EVENT_REMINDER',
    EVENT_DELETED: 'EVENT_DELETED',
    ACHIEVEMENT_EARNED: 'ACHIEVEMENT_EARNED',
    LEVEL_UP: 'LEVEL_UP',
    COMMENT_REPLY: 'COMMENT_REPLY',
    PARK_REVIEW: 'PARK_REVIEW',
    PARK_CHECKED_IN: 'PARK_CHECKED_IN',
    PARK_DELETED: 'PARK_DELETED',
    ORGANIZATION_INVITE: 'ORGANIZATION_INVITE',
    ENEMY_REMOVED: 'ENEMY_REMOVED',
    FRIEND_REMOVED: 'FRIEND_REMOVED',
    DOG_PHOTO_UPLOADED: 'DOG_PHOTO_UPLOADED',
    DOG_PHOTO_REMOVED: 'DOG_PHOTO_REMOVED',
  },
}));

import { handleDogOwnershipRemovedNotifications } from '../handlers/notifications/onDogOwnershipRemoved';
import { handleDogCreatedNotifications } from '../handlers/notifications/onDogCreated';
import { handleDogDeletedNotifications } from '../handlers/notifications/onDogDeleted';
import { handleOrganizationMemberRemovedNotifications } from '../handlers/notifications/onOrganizationMemberRemoved';
import { handleOrganizationDeletedNotifications } from '../handlers/notifications/onOrganizationDeleted';
import { handleParkDeletedNotifications } from '../handlers/notifications/onParkDeleted';
import { handleEventDeletedNotifications } from '../handlers/notifications/onEventDeleted';
import { handleEnemyRemovedNotifications } from '../handlers/notifications/onEnemyRemoved';
import { handleFriendRemovedNotifications } from '../handlers/notifications/onFriendRemoved';
import { handleUserProfilePictureUploadedNotifications } from '../handlers/notifications/onUserProfilePictureUploaded';
import { handleUserProfilePictureDeletedNotifications } from '../handlers/notifications/onUserProfilePictureDeleted';
import { handleDogPhotoUploadedNotifications } from '../handlers/notifications/onDogPhotoUploaded';
import { handleDogPhotoDeletedNotifications } from '../handlers/notifications/onDogPhotoDeleted';
import { handleParkCheckedInNotifications } from '../handlers/notifications/onParkCheckedIn';

const makeEvent = (type: string, payload: Record<string, unknown>) => ({
  id: 'event-id',
  type,
  occurredAt: new Date().toISOString(),
  payload,
  version: 1,
});

describe('Notification handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Dog ownership removed notifies removed owner', async () => {
    await handleDogOwnershipRemovedNotifications(
      makeEvent(EventTypes.DogOwnershipRemoved, { dogId: 1, userId: 2, removedBy: 3 }) as any
    );

    expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
      2,
      NotificationType.DOG_OWNERSHIP_REMOVED,
      { dogId: 1, removedBy: 3 }
    );
  });

  test('Dog created notifies owners', async () => {
    await handleDogCreatedNotifications(
      makeEvent(EventTypes.DogCreated, { dogId: 5, name: 'Rex', ownerIds: [7, 8] }) as any
    );

    expect(mockNotificationService.createNotifications).toHaveBeenCalledWith(
      [7, 8],
      NotificationType.DOG_CREATED,
      { dogId: 5, name: 'Rex' }
    );
  });

  test('Dog deleted notifies owners', async () => {
    await handleDogDeletedNotifications(
      makeEvent(EventTypes.DogDeleted, { dogId: 5, name: 'Rex', ownerIds: [7, 8], deletedBy: 1 }) as any
    );

    expect(mockNotificationService.createNotifications).toHaveBeenCalledWith(
      [7, 8],
      NotificationType.DOG_DELETED,
      { dogId: 5, name: 'Rex', deletedBy: 1 }
    );
  });

  test('Organization member removed notifies member', async () => {
    await handleOrganizationMemberRemovedNotifications(
      makeEvent(EventTypes.OrganizationMemberRemoved, { organizationId: 9, userId: 4, removedBy: 2 }) as any
    );

    expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
      4,
      NotificationType.ORGANIZATION_MEMBER_REMOVED,
      { organizationId: 9, removedBy: 2 }
    );
  });

  test('Organization deleted notifies members', async () => {
    await handleOrganizationDeletedNotifications(
      makeEvent(EventTypes.OrganizationDeleted, { organizationId: 9, memberIds: [4, 6], deletedBy: 2 }) as any
    );

    expect(mockNotificationService.createNotifications).toHaveBeenCalledWith(
      [4, 6],
      NotificationType.ORGANIZATION_DELETED,
      { organizationId: 9, deletedBy: 2 }
    );
  });

  test('Park deleted notifies staff and favorites', async () => {
    mockPrisma.user.findMany.mockResolvedValue([{ id: 10 }, { id: 11 }]);

    await handleParkDeletedNotifications(
      makeEvent(EventTypes.ParkDeleted, { parkId: 3, name: 'Central', favoriteUserIds: [2, 10] }) as any
    );

    expect(mockNotificationService.createNotifications).toHaveBeenCalledWith(
      [2, 10, 11],
      NotificationType.PARK_DELETED,
      { parkId: 3, name: 'Central', deletedBy: undefined }
    );
  });

  test('Event deleted notifies attendees and org leaders', async () => {
    mockPrisma.organizationMember.findMany.mockResolvedValue([{ userId: 99 }]);

    await handleEventDeletedNotifications(
      makeEvent(EventTypes.EventDeleted, { eventId: 7, organizationId: 12, attendeeIds: [1, 2] }) as any
    );

    expect(mockNotificationService.createNotifications).toHaveBeenCalledWith(
      [1, 2, 99],
      NotificationType.EVENT_DELETED,
      {
        eventId: 7,
        organizerId: undefined,
        organizationId: 12,
        parkId: undefined,
        title: undefined,
      }
    );
  });

  test('Enemy removed notifies owner', async () => {
    await handleEnemyRemovedNotifications(
      makeEvent(EventTypes.EnemyRemoved, { ownerId: 1, enemyUserId: 2 }) as any
    );

    expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
      1,
      NotificationType.ENEMY_REMOVED,
      { enemyUserId: 2 }
    );
  });

  test('Friend removed notifies both users', async () => {
    await handleFriendRemovedNotifications(
      makeEvent(EventTypes.FriendRemoved, { userId: 1, friendId: 2, removedBy: 1 }) as any
    );

    expect(mockNotificationService.createNotifications).toHaveBeenCalledWith(
      [1, 2],
      NotificationType.FRIEND_REMOVED,
      { userId: 1, friendId: 2, dogId: undefined, friendDogId: undefined, removedBy: 1 }
    );
  });

  test('User profile picture uploaded notifies user', async () => {
    await handleUserProfilePictureUploadedNotifications(
      makeEvent(EventTypes.UserProfilePictureUploaded, { userId: 1, profilePictureUrl: '/path.png' }) as any
    );

    expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
      1,
      NotificationType.USER_PHOTO_UPLOADED,
      { profilePictureUrl: '/path.png' }
    );
  });

  test('User profile picture deleted notifies user', async () => {
    await handleUserProfilePictureDeletedNotifications(
      makeEvent(EventTypes.UserProfilePictureDeleted, { userId: 1, previousUrl: '/path.png' }) as any
    );

    expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
      1,
      NotificationType.USER_PHOTO_REMOVED,
      { previousUrl: '/path.png' }
    );
  });

  test('Dog photo uploaded notifies owners', async () => {
    mockPrisma.dogOwner.findMany.mockResolvedValue([{ userId: 5 }, { userId: 6 }]);

    await handleDogPhotoUploadedNotifications(
      makeEvent(EventTypes.DogPhotoUploaded, { dogId: 2, profilePictureUrl: '/dog.png' }) as any
    );

    expect(mockNotificationService.createNotifications).toHaveBeenCalledWith(
      [5, 6],
      NotificationType.DOG_PHOTO_UPLOADED,
      { dogId: 2, profilePictureUrl: '/dog.png' }
    );
  });

  test('Dog photo deleted notifies owners', async () => {
    mockPrisma.dogOwner.findMany.mockResolvedValue([{ userId: 5 }]);

    await handleDogPhotoDeletedNotifications(
      makeEvent(EventTypes.DogPhotoDeleted, { dogId: 2, previousUrl: '/dog.png' }) as any
    );

    expect(mockNotificationService.createNotifications).toHaveBeenCalledWith(
      [5],
      NotificationType.DOG_PHOTO_REMOVED,
      { dogId: 2, previousUrl: '/dog.png' }
    );
  });

  test('Park check-in notifies user', async () => {
    await handleParkCheckedInNotifications(
      makeEvent(EventTypes.ParkCheckedIn, { checkInId: 1, userId: 3, parkId: 9, dogId: 4 }) as any
    );

    expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
      3,
      NotificationType.PARK_CHECKED_IN,
      { parkId: 9, dogId: 4 }
    );
  });
});
