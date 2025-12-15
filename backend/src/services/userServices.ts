import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/password';
import logger from '../utils/logger';

const prisma = new PrismaClient();

//TODO userServices.ts
// Implement user-related services such as registration, authentication, profile management, etc.
const userService = {
  
  async createUser(username: string, email: string, password: string, first_name?: string, last_name?: string, profilePictureUrl?: string) {
    logger.info('Creating user', { username, email });
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
      logger.info('User created successfully', { userId: newUser.id, email });
      return newUser;
    } catch (error) {
      logger.error('Failed to create user', { email, error });
      throw error;
    }
  },

  async getUserByEmail(email: string) {
    logger.info('Fetching user by email', { email });
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });
      if (user) {
        logger.info('User found by email', { email, userId: user.id });
      } else {
        logger.warn('User not found by email', { email });
      }
      return user;
    } catch (error) {
      logger.error('Failed to fetch user by email', { email, error });
      throw error;
    }
  }
};

export default userService;