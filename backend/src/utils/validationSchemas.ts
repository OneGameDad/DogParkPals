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


export const createFriendRequestSchema = z.object({
  requesterId: z.number().int().positive('Requester ID must be a positive integer'),
  addresseeId: z.number().int().positive('Addressee ID must be a positive integer'),
}).refine((data) => data.requesterId !== data.addresseeId, {
  message: 'Requester ID and Addressee ID must be different',
  path: ['addresseeId'],
});

export type CreateFriendRequest = z.infer<typeof createFriendRequestSchema>;

export const respondToFriendRequestSchema = z.object({
  requesterId: z.number().int().positive('Requester ID must be a positive integer'),
  addresseeId: z.number().int().positive('Addressee ID must be a positive integer'),
  accept: z.boolean(),
});

export type RespondToFriendRequest = z.infer<typeof respondToFriendRequestSchema>;

export const getUserIdSchema = z.object({
  userId: z.number().int().positive('User ID must be a positive integer'),
});

export type GetUserIdRequest = z.infer<typeof getUserIdSchema>;

export const removeFriendSchema = z.object({
  userId: z.number().int().positive('User ID must be a positive integer'),
  friendId: z.number().int().positive('Friend ID must be a positive integer'),
}).refine((data) => data.userId !== data.friendId, {
  message: 'User ID and Friend ID must be different',
  path: ['friendId'],
});

export type RemoveFriendRequest = z.infer<typeof removeFriendSchema>;

export const addEnemySchema = z.object({
  userId: z.number().int().positive('User ID must be a positive integer'),
  enemyUserId: z.number().int().positive('Enemy User ID must be a positive integer'),
  confirmed: z.boolean().optional().default(false),
}).refine((data) => data.userId !== data.enemyUserId, {
  message: 'User ID and Enemy User ID must be different',
  path: ['enemyUserId'],
});

export type AddEnemyRequest = z.infer<typeof addEnemySchema>;

export const removeEnemySchema = z.object({
  userId: z.number().int().positive('User ID must be a positive integer'),
  enemyUserId: z.number().int().positive('Enemy User ID must be a positive integer'),
}).refine((data) => data.userId !== data.enemyUserId, {
  message: 'User ID and Enemy User ID must be different',
  path: ['enemyUserId'],
});

export type RemoveEnemyRequest = z.infer<typeof removeEnemySchema>;

export const checkEnemySchema = z.object({
  userId: z.number().int().positive('User ID must be a positive integer'),
  potentialEnemyUserId: z.number().int().positive('Potential Enemy User ID must be a positive integer'),
}).refine((data) => data.userId !== data.potentialEnemyUserId, {
  message: 'User ID and Potential Enemy User ID must be different',
  path: ['potentialEnemyUserId'],
});

export type CheckEnemyRequest = z.infer<typeof checkEnemySchema>;