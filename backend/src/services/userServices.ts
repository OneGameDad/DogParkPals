import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { hashPassword, verifyPassword } from '../utils/password';
import typeSafeLogger from '../utils/typeSafeLogger';
import { AuthError, NotFoundError, toAppError } from '../utils/errors';

const prisma = new PrismaClient();

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
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data,
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

};

export default userService;