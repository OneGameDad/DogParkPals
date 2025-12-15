import { z } from 'zod';

export const createUserSchema = z.object({
  username: z.string().min(1, 'Username is required').min(3, 'Username must be at least 3 characters'),
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  password: z.string().min(1, 'Password is required').min(8, 'Password must be at least 8 characters long'),
});

export type CreateUserRequest = z.infer<typeof createUserSchema>;

export const getUserByEmailSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
});

export type GetUserByEmailRequest = z.infer<typeof getUserByEmailSchema>;
