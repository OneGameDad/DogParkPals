import 'dotenv/config';
import { PrismaClient, UserRole, NotificationType } from '@prisma/client';
import { hashPassword, verifyPassword } from '../utils/password';
import typeSafeLogger from '../utils/typeSafeLogger';
import { AuthError, ForbiddenError, NotFoundError, toAppError } from '../utils/errors';
import notificationService from './notificationService';
import path from 'path';
import fs from "fs";

const prisma = new PrismaClient();

const HEARTBEAT_INTERVAL_SECONDS = 150;
const OFFLINE_TIMEOUT_SECONDS = 300;

const isOnlineFromLastSeen = (lastSeenAt: Date | null) => {
  if (!lastSeenAt) return false;
  const lastSeenMs = lastSeenAt.getTime();
  return Date.now() - lastSeenMs <= OFFLINE_TIMEOUT_SECONDS * 1000;
};

//TODO userServices.ts
// Implement user-related services such as registration, authentication, profile management, etc.
const userService = {
  
  async createUser(username: string, email: string, password: string, first_name?: string, last_name?: string, profilePictureUrl?: string) {
    typeSafeLogger.logUserAction('Creating user', { username, email });
    try {
      const hashedPassword = await hashPassword(password);
      const newUser = await prisma.user.create({
        data: {
          username,
          first_name,
          last_name,
          email,
          password_hash: hashedPassword,
          profilePictureUrl,
        },
      });
      typeSafeLogger.logUserAction('User created successfully', { userId: newUser.id, email });
      return newUser;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to create user',
        code: 'CREATE_USER_FAILED',
      });
      typeSafeLogger.logError('Failed to create user', appError, { email });
      throw appError;
    }
  },

  // Upsert by email for OAuth flows to avoid race conditions on concurrent logins
  async upsertUserByEmailOAuth(
    username: string,
    email: string,
    password: string,
    first_name?: string,
    last_name?: string,
    profilePictureUrl?: string
  ) {
    typeSafeLogger.logUserAction('Upserting user via Google OAuth', { email });
    try {
      const hashedPassword = await hashPassword(password);
      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          username,
          first_name,
          last_name,
          email,
          password_hash: hashedPassword,
          profilePictureUrl,
        },
      });
      typeSafeLogger.logUserAction('User upserted via Google OAuth', { userId: user.id, email });
      return user;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to upsert user via Google OAuth',
        code: 'UPSERT_USER_OAUTH_FAILED',
      });
      typeSafeLogger.logError('Failed to upsert user via Google OAuth', appError, { email });
      throw appError;
    }
  },

  async getUserByEmail(email: string) {
    typeSafeLogger.info('Fetching user by email', { email });
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });
      if (user) {
        typeSafeLogger.logUserAction('User found by email', { email, userId: user.id });
      } else {
        typeSafeLogger.warn('User not found by email', { email });
      }
      return user;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to fetch user by email',
        code: 'FETCH_USER_FAILED',
      });
      typeSafeLogger.logError('Failed to fetch user by email', appError, { email });
      throw appError;
    }
  },

  async getUserById(id: number) {
    typeSafeLogger.info('Fetching user by id', { id });
    try {
      const user = await prisma.user.findUnique({ where: { id } });
      if (user) {
        typeSafeLogger.logUserAction('User found by id', { userId: user.id });
      } else {
        typeSafeLogger.warn('User not found by id', { id });
      }
      return user;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to fetch user by id',
        code: 'FETCH_USER_FAILED',
      });
      typeSafeLogger.logError('Failed to fetch user by id', appError, { id });
      throw appError;
    }
  },

  async recordHeartbeat(userId: number) {
    typeSafeLogger.logUserAction('Recording heartbeat', { userId });
    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { lastSeenAt: new Date() },
        select: { id: true, lastSeenAt: true },
      });

      return {
        userId: updatedUser.id,
        lastSeenAt: updatedUser.lastSeenAt,
        isOnline: isOnlineFromLastSeen(updatedUser.lastSeenAt),
        heartbeatIntervalSeconds: HEARTBEAT_INTERVAL_SECONDS,
        offlineTimeoutSeconds: OFFLINE_TIMEOUT_SECONDS,
      };
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to record heartbeat',
        code: 'RECORD_HEARTBEAT_FAILED',
      });
      typeSafeLogger.logError('Failed to record heartbeat', appError, { userId });
      throw appError;
    }
  },

  async getUserPresence(userId: number) {
    typeSafeLogger.logUserAction('Fetching user presence', { userId });
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, lastSeenAt: true },
      });

      if (!user) {
        throw NotFoundError('User not found');
      }

      return {
        userId: user.id,
        lastSeenAt: user.lastSeenAt,
        isOnline: isOnlineFromLastSeen(user.lastSeenAt),
        heartbeatIntervalSeconds: HEARTBEAT_INTERVAL_SECONDS,
        offlineTimeoutSeconds: OFFLINE_TIMEOUT_SECONDS,
      };
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to fetch user presence',
        code: 'FETCH_PRESENCE_FAILED',
      });
      typeSafeLogger.logError('Failed to fetch user presence', appError, { userId });
      throw appError;
    }
  },

  async getUserByUsername(username: string) {
    typeSafeLogger.info('Fetching user by username', { username });
    try {
      const user = await prisma.user.findUnique({ where: { username } });
      if (user) {
        typeSafeLogger.logUserAction('User found by username', { userId: user.id, username });
      } else {
        typeSafeLogger.warn('User not found by username', { username });
      }
      return user;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to fetch user by username',
        code: 'FETCH_USER_FAILED',
      });
      typeSafeLogger.logError('Failed to fetch user by username', appError, { username });
      throw appError;
    }
  },

  async listUsers(page = 1, pageSize = 50) {
    typeSafeLogger.info('Listing users', { page, pageSize });
    try {
      const skip = (page - 1) * pageSize;
      const users = await prisma.user.findMany({ skip, take: pageSize, orderBy: { id: 'asc' } });
      return users;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to list users',
        code: 'FETCH_USER_FAILED',
      });
      typeSafeLogger.logError('Failed to list users', appError, { page, pageSize });
      throw appError;
    }
  },

  async changeUserRole(adminUserId: number, targetUserId: number, role: UserRole) {
    typeSafeLogger.logUserAction('Changing user role', { adminUserId, targetUserId, role });
    try {
      const adminUser = await prisma.user.findUnique({
        where: { id: adminUserId },
        select: { id: true, role: true },
      });
      if (!adminUser) {
        throw NotFoundError('Admin user not found');
      }
      if (adminUser.role !== 'ADMIN') {
        throw ForbiddenError('Admin role required');
      }

      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true },
      });
      if (!targetUser) {
        throw NotFoundError('User not found');
      }

      const updatedUser = await prisma.$transaction(async (tx) => {
        const user = await tx.user.update({
          where: { id: targetUserId },
          data: { role },
        });
        await notificationService.createNotification(
          targetUserId,
          NotificationType.USER_ROLE_UPDATED,
          { role },
          tx
        );
        return user;
      });
      typeSafeLogger.logUserAction('User role updated', { adminUserId, targetUserId, role });
      return updatedUser;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to change user role',
        code: 'CHANGE_USER_ROLE_FAILED',
      });
      typeSafeLogger.logError('Failed to change user role', appError, { adminUserId, targetUserId, role });
      throw appError;
    }
  },

  async changeUsername(requestingUserId: number, targetUserId: number, newUsername: string) {
    typeSafeLogger.logUserAction('Changing username', { requestingUserId, targetUserId, newUsername });
    try {
      if (requestingUserId !== targetUserId) {
        const requestingUser = await prisma.user.findUnique({
          where: { id: requestingUserId },
          select: { id: true, role: true },
        });
        if (!requestingUser) {
          throw NotFoundError('Requesting user not found');
        }
        if (requestingUser.role !== 'ADMIN' && requestingUser.role !== 'DEVELOPER') {
          throw ForbiddenError('Admin or developer role required');
        }
      }

      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, username: true },
      });
      if (!targetUser) {
        throw NotFoundError('User not found');
      }

      const updatedUser = await prisma.$transaction(async (tx) => {
        const user = await tx.user.update({
          where: { id: targetUserId },
          data: { username: newUsername },
        });
        await notificationService.createNotification(
          targetUserId,
          NotificationType.PROFILE_UPDATED,
          {
            username: newUsername,
            updatedBy: requestingUserId,
          },
          tx
        );
        return user;
      });

      typeSafeLogger.logUserAction('Username changed', {
        requestingUserId,
        targetUserId,
        previousUsername: targetUser.username,
        newUsername,
      });
      return updatedUser;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to change username',
        code: 'CHANGE_USERNAME_FAILED',
      });
      typeSafeLogger.logError('Failed to change username', appError, {
        requestingUserId,
        targetUserId,
        newUsername,
      });
      throw appError;
    }
  },

  async deleteUser(id: number) {
    typeSafeLogger.logUserAction('Deleting user', { id });
    try {
      await prisma.user.delete({ where: { id } });
      typeSafeLogger.logUserAction('User deleted', { id });
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to delete user',
        code: 'DELETE_USER_FAILED',
      });
      typeSafeLogger.logError('Failed to delete user', appError, { id });
      throw appError;
    }
  },

  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    typeSafeLogger.logUserAction('Changing password', { userId });
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw NotFoundError('User not found');
      }

      const isValid = await verifyPassword(oldPassword, user.password_hash);
      if (!isValid) {
        throw AuthError('Invalid credentials');
      }

      const hashedPassword = await hashPassword(newPassword);
      await prisma.user.update({
        where: { id: userId },
        data: { password_hash: hashedPassword },
      });
      typeSafeLogger.logUserAction('Password changed', { userId });
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to change password',
        code: 'CHANGE_PASSWORD_FAILED',
      });
      typeSafeLogger.logError('Failed to change password', appError, { userId });
      throw appError;
    }
  },

  async resetUserPassword(userId: number, newPassword: string) {
    typeSafeLogger.logUserAction('Admin resetting user password', { userId });
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw NotFoundError('User not found');
      }

      const hashedPassword = await hashPassword(newPassword);
      await prisma.user.update({
        where: { id: userId },
        data: { password_hash: hashedPassword },
      });
      typeSafeLogger.logUserAction('Admin password reset successful', { userId });
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to reset user password',
        code: 'RESET_PASSWORD_FAILED',
      });
      typeSafeLogger.logError('Failed to reset user password', appError, { userId });
      throw appError;
    }
  },

  async updateUserProfile(
    userId: number,
    updates: {
      first_name?: string | null;
      last_name?: string | null;
      profilePictureUrl?: string | null;
      latitude?: number | null;
      longitude?: number | null;
    }
  ) {
    typeSafeLogger.logUserAction('Updating user profile', { userId });

    const data: Record<string, unknown> = {};
    if (updates.first_name !== undefined) data.first_name = updates.first_name;
    if (updates.last_name !== undefined) data.last_name = updates.last_name;
    if (updates.profilePictureUrl !== undefined) data.profilePictureUrl = updates.profilePictureUrl;
    if (updates.latitude !== undefined) data.latitude = updates.latitude;
    if (updates.longitude !== undefined) data.longitude = updates.longitude;

    try {
      const updatedUser = await prisma.$transaction(async (tx) => {
        const user = await tx.user.update({
          where: { id: userId },
          data,
        });
        await notificationService.createNotification(
          userId,
          NotificationType.PROFILE_UPDATED,
          { fields: Object.keys(data) },
          tx
        );
        return user;
      });

      typeSafeLogger.logUserAction('User profile updated', { userId, fields: Object.keys(data) });
      return updatedUser;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to update user profile',
        code: 'UPDATE_PROFILE_FAILED',
      });
      typeSafeLogger.logError('Failed to update user profile', appError, { userId });
      throw appError;
    }
  },

  async uploadProfilePicture(userId: number, filePath: string) {
    typeSafeLogger.logUserAction('Uploading profile picture', { userId, filePath });
    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { profilePictureUrl: filePath },
        select: { profilePictureUrl: true },
      });
      typeSafeLogger.logUserAction('Profile picture uploaded', { userId, filePath });
      return updatedUser;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to upload profile picture',
        code: 'UPLOAD_PROFILE_PICTURE_FAILED',
      });
      typeSafeLogger.logError('Failed to upload profile picture', appError, { userId, filePath });
      throw appError;
    }
  },

  async deleteProfilePicture(userId: number) {
    typeSafeLogger.logUserAction('Deleting profile picture', { userId });
    try {
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { profilePictureUrl: true },
      });
      if (!existingUser?.profilePictureUrl) return null;
      const filePath = path.join(__dirname, '../../', existingUser.profilePictureUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { profilePictureUrl: null },
      });
      typeSafeLogger.logUserAction('Profile picture deleted', { userId });
      return updatedUser;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to delete profile picture',
        code: 'DELETE_PROFILE_PICTURE_FAILED',
      });
      typeSafeLogger.logError('Failed to delete profile picture', appError, { userId });
      throw appError;
    }
  },
};

export default userService;