import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/password';
import typeSafeLogger from '../utils/typeSafeLogger';
import { toAppError } from '../utils/errors';

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
  }
};

export default userService;