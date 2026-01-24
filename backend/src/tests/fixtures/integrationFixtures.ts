// Integration fixture outline for API tests
// Fill in implementations when wiring test DB + supertest suites

import { PrismaClient, FriendshipStatus, MessageStatus, OrgRole, UserRole, EventPrivacy, DogBreed, NotificationType } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Roles used across tests
export const roles = {
  admin: 'ADMIN',
  developer: 'DEVELOPER',
  owner: 'OWNER',
  moderator: 'MODERATOR',
  member: 'MEMBER',
  user: 'CLIENT',
} as const;

// Shared IDs to make seeding deterministic
export const ids = {
  users: {
    admin: 1,
    developer: 2,
    orgOwner: 3,
    orgModerator: 4,
    orgMember: 5,
    userA: 6,
    userB: 7,
    userC: 8,
  },
  orgs: { org1: 101, org2: 102 },
  parks: { park1: 201, park2: 202, park3: 203 },
  dogs: { dogA: 301, dogB: 302, dogC: 303, dogD: 304 },
  events: { event1: 401, event2: 402 },
  messages: { msg1: 501, msg2: 502, msg3: 503 },
  notifications: { n1: 601, n2: 602, n3: 603 },
};

// Test secrets and token helpers
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

export function makeToken(user: { id: number; role?: string }) {
  return jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: '1h',
    jwtid: `${Date.now()}-${Math.random()}`,
  });
}

// Seed builders (outline)
export async function seedUsers() {
  const password = await bcrypt.hash('password', 10);

  await prisma.user.createMany({
    data: [
      { id: ids.users.admin, email: 'admin@example.com', username: 'admin', password_hash: password, role: UserRole.ADMIN },
      { id: ids.users.developer, email: 'dev@example.com', username: 'dev', password_hash: password, role: UserRole.DEVELOPER },
      { id: ids.users.orgOwner, email: 'owner@example.com', username: 'owner', password_hash: password },
      { id: ids.users.orgModerator, email: 'mod@example.com', username: 'mod', password_hash: password },
      { id: ids.users.orgMember, email: 'member@example.com', username: 'member', password_hash: password },
      { id: ids.users.userA, email: 'usera@example.com', username: 'usera', password_hash: password },
      { id: ids.users.userB, email: 'userb@example.com', username: 'userb', password_hash: password },
      { id: ids.users.userC, email: 'userc@example.com', username: 'userc', password_hash: password },
    ],
  });
}

export async function seedOrganizations() {
  await prisma.organization.createMany({
    data: [
      { id: ids.orgs.org1, name: 'Org One', ownerId: ids.users.orgOwner },
      { id: ids.orgs.org2, name: 'Org Two', ownerId: ids.users.developer },
    ],
  });

  await prisma.organizationMember.createMany({
    data: [
      { organizationId: ids.orgs.org1, userId: ids.users.orgOwner, role: OrgRole.OWNER },
      { organizationId: ids.orgs.org1, userId: ids.users.orgModerator, role: OrgRole.MODERATOR },
      { organizationId: ids.orgs.org1, userId: ids.users.orgMember, role: OrgRole.MEMBER },
    ],
  });
}

export async function seedParks() {
  await prisma.park.createMany({
    data: [
      { id: ids.parks.park1, name: 'Central Bark', latitude: 40.0, longitude: -74.0, amenities: ['WATER_FOUNTAIN', 'SHADE'] },
      { id: ids.parks.park2, name: 'Riverside Run', latitude: 41.0, longitude: -73.9, amenities: ['BENCHES'] },
      { id: ids.parks.park3, name: 'Hilltop Park', latitude: 39.9, longitude: -74.1, amenities: [] },
    ],
  });
}

export async function seedDogs() {
  await prisma.dog.createMany({
    data: [
      { id: ids.dogs.dogA, name: 'Rex', breed: DogBreed.MIXED_BREED, gender: 'MALE', dateOfBirth: new Date('2020-01-01') },
      { id: ids.dogs.dogB, name: 'Luna', breed: DogBreed.MIXED_BREED, gender: 'FEMALE', dateOfBirth: new Date('2019-06-15') },
      { id: ids.dogs.dogC, name: 'Buddy', breed: DogBreed.MIXED_BREED, gender: 'MALE', dateOfBirth: new Date('2021-03-10') },
      { id: ids.dogs.dogD, name: 'Shadow', breed: DogBreed.MIXED_BREED, gender: 'MALE', dateOfBirth: new Date('2018-11-20') },
    ],
  });

  await prisma.dogOwner.createMany({
    data: [
      { dogId: ids.dogs.dogA, userId: ids.users.userA },
      { dogId: ids.dogs.dogB, userId: ids.users.userB },
      // shared ownership
      { dogId: ids.dogs.dogC, userId: ids.users.userA },
      { dogId: ids.dogs.dogC, userId: ids.users.userB },
    ],
  });
}

export async function seedFriendsEnemies() {
  await prisma.friendship.createMany({
    data: [
      // accepted friendship userA <-> userB
      { requesterId: ids.users.userA, addresseeId: ids.users.userB, status: FriendshipStatus.ACCEPTED },
      // pending request userA -> userC
      { requesterId: ids.users.userA, addresseeId: ids.users.userC, status: FriendshipStatus.PENDING },
    ],
  });

  await prisma.enemies.createMany({
    data: [
      { ownerId: ids.users.userA, enemyUserId: ids.users.userB },
    ],
  });
}

export async function seedEvents() {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  await prisma.event.createMany({
    data: [
      {
        id: ids.events.event1,
        title: 'Morning Meetup',
        description: 'Public meetup',
        private: EventPrivacy.PUBLIC,
        date: tomorrow,
        startTime: tomorrow,
        endTime: new Date(tomorrow.getTime() + 60 * 60 * 1000),
        parkId: ids.parks.park1,
        organizationId: ids.orgs.org1,
        organizerId: ids.users.orgOwner,
      },
      {
        id: ids.events.event2,
        title: 'Private Training',
        description: 'Private event',
        private: EventPrivacy.PRIVATE,
        date: yesterday,
        startTime: yesterday,
        endTime: new Date(yesterday.getTime() + 60 * 60 * 1000),
        parkId: ids.parks.park2,
        organizationId: ids.orgs.org1,
        organizerId: ids.users.orgModerator,
      },
    ],
  });
}

export async function seedMessages() {
  await prisma.messages.createMany({
    data: [
      { id: ids.messages.msg1, senderId: ids.users.userA, receiverId: ids.users.userB, content: 'Hi there', status: MessageStatus.SENT },
      { id: ids.messages.msg2, senderId: ids.users.userB, receiverId: ids.users.userA, content: 'Hello!', status: MessageStatus.DELIVERED },
      { id: ids.messages.msg3, senderId: ids.users.userA, receiverId: ids.users.userB, content: 'Unread ping', status: MessageStatus.SENT },
    ],
  });
}

export async function seedNotifications() {
  await prisma.notification.createMany({
    data: [
      { id: ids.notifications.n1, userId: ids.users.userA, type: NotificationType.MESSAGE_RECEIVED, payload: { messageId: ids.messages.msg1 }, read: false },
      { id: ids.notifications.n2, userId: ids.users.userA, type: NotificationType.FRIENDSHIP_REQUEST, payload: { fromUserId: ids.users.userC }, read: true, readAt: new Date() },
      { id: ids.notifications.n3, userId: ids.users.userB, type: NotificationType.ORGANIZATION_INVITE, payload: { organizationId: ids.orgs.org1 }, read: false },
    ],
  });
}

// Master seed entrypoint
export async function seedAll() {
  await seedUsers();
  await seedOrganizations();
  await seedParks();
  await seedDogs();
  await seedFriendsEnemies();
  await seedEvents();
  await seedMessages();
  await seedNotifications();
}

// Cleanup helper per test suite
export async function resetData() {
  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.messages.deleteMany(),
    prisma.enemies.deleteMany(),
    prisma.friendship.deleteMany(),
    prisma.checkIn.deleteMany(),
    prisma.dogOwner.deleteMany(),
    prisma.userFavoritePark.deleteMany(),
    prisma.event.deleteMany(),
    prisma.organizationMember.deleteMany(),
    prisma.organization.deleteMany(),
    prisma.park.deleteMany(),
    prisma.dog.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

// Close DB when done
export async function closeDb() {
  await prisma.$disconnect();
}
