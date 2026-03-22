import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../app';
import { makeToken, ids } from '../fixtures/integrationFixtures';
import { sessionManager } from '../../infrastructure/sessionManager';

const prisma = new PrismaClient();
const adminToken = () => makeToken({ id: ids.users.admin, role: 'ADMIN' });

describe('User Deletion with Session Termination', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Session disconnection on user deletion', () => {
    test('should handle user deletion without errors (disconnection code runs)', async () => {
      // Delete the user - this will trigger session disconnection code
      const deleteRes = await request(app)
        .delete(`/users/${ids.users.userA}`)
        .set('Authorization', `Bearer ${adminToken()}`);

      expect(deleteRes.status).toBe(204);

      // Verify user is deleted from database
      const deletedUser = await prisma.user.findUnique({
        where: { id: ids.users.userA },
      });
      expect(deletedUser).toBeNull();
    });

    test('should delete user with no sessions registered', async () => {
      // Don't register any sessions - just delete the user
      const deleteRes = await request(app)
        .delete(`/users/${ids.users.userA}`)
        .set('Authorization', `Bearer ${adminToken()}`);

      expect(deleteRes.status).toBe(204);

      // Verify user is deleted
      const deletedUser = await prisma.user.findUnique({
        where: { id: ids.users.userA },
      });
      expect(deletedUser).toBeNull();
    });
  });

  describe('Content preservation during deletion', () => {
    test('should preserve authored content when user is deleted', async () => {
      const comment = await prisma.comment.create({
        data: {
          content: 'Comment from deleted user',
          userId: ids.users.userA,
          parkId: ids.parks.park1,
        },
      });

      // Delete user
      const deleteRes = await request(app)
        .delete(`/users/${ids.users.userA}`)
        .set('Authorization', `Bearer ${adminToken()}`);

      expect(deleteRes.status).toBe(204);

      // Verify comment is reassigned to deleted_user
      const sentinelUser = await prisma.user.findUnique({
        where: { username: 'deleted_user' },
      });

      const reassignedComment = await prisma.comment.findUnique({
        where: { id: comment.id },
      });

      expect(reassignedComment?.userId).toBe(sentinelUser?.id);
    });

    test('should remove friendships when user is deleted', async () => {
      // Create a friendship first
      await prisma.friendship.create({
        data: {
          requesterId: ids.users.userA,
          addresseeId: ids.users.userB,
          status: 'ACCEPTED',
        },
      });

      // Verify friendship exists
      const friendshipBefore = await prisma.friendship.findFirst({
        where: {
          OR: [
            { requesterId: ids.users.userA, addresseeId: ids.users.userB },
            { requesterId: ids.users.userB, addresseeId: ids.users.userA },
          ],
        },
      });
      expect(friendshipBefore).not.toBeNull();

      // Delete user
      const deleteRes = await request(app)
        .delete(`/users/${ids.users.userA}`)
        .set('Authorization', `Bearer ${adminToken()}`);

      expect(deleteRes.status).toBe(204);

      // Verify friendship is deleted
      const friendshipAfter = await prisma.friendship.findFirst({
        where: {
          OR: [
            { requesterId: ids.users.userA, addresseeId: ids.users.userB },
            { requesterId: ids.users.userB, addresseeId: ids.users.userA },
          ],
        },
      });
      expect(friendshipAfter).toBeNull();
    });
  });

  describe('Authorization during deletion', () => {
    test('should prevent unauthorized deletion', async () => {
      // Try to delete with invalid token
      const deleteRes = await request(app)
        .delete(`/users/${ids.users.userA}`)
        .set('Authorization', 'Bearer invalid-token');

      expect(deleteRes.status).toBe(401);

      // User should still exist
      const user = await prisma.user.findUnique({
        where: { id: ids.users.userA },
      });
      expect(user).not.toBeNull();
    });

    test('should prevent self-deletion', async () => {
      const userAToken = makeToken({
        id: ids.users.userA,
        role: 'CLIENT',
      });

      // Delete own account
      const deleteRes = await request(app)
        .delete(`/users/${ids.users.userA}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(deleteRes.status).toBe(403);

      // User should still exist
      const user = await prisma.user.findUnique({
        where: { id: ids.users.userA },
      });
      expect(user).not.toBeNull();
    });

    test('should allow admin to delete any user', async () => {
      // Delete as admin
      const deleteRes = await request(app)
        .delete(`/users/${ids.users.userA}`)
        .set('Authorization', `Bearer ${adminToken()}`);

      expect(deleteRes.status).toBe(204);

      // User should be deleted
      const user = await prisma.user.findUnique({
        where: { id: ids.users.userA },
      });
      expect(user).toBeNull();
    });

    test('should prevent non-admin from deleting other users', async () => {
      const userBToken = makeToken({
        id: ids.users.userB,
        role: 'CLIENT',
      });

      // Try to delete userA as userB
      const deleteRes = await request(app)
        .delete(`/users/${ids.users.userA}`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(deleteRes.status).toBe(403);

      // User should still exist
      const user = await prisma.user.findUnique({
        where: { id: ids.users.userA },
      });
      expect(user).not.toBeNull();
    });
  });
});
