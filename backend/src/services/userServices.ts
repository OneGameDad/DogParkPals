import 'dotenv/config';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/password';

const prisma = new PrismaClient();

//TODO userServices.ts
// Implement user-related services such as registration, authentication, profile management, etc.
const userService = {
  
  async createUser(username: string, email: string, password: string, first_name?: string, last_name?: string, profilePictureUrl?: string) {
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
    return newUser;
  },

  async getUserByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
    });
  }
};

export default userService;