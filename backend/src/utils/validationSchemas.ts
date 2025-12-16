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

export const addDogSchema = z.object({
  name: z.string().min(1, 'Dog name is required').min(2, 'Dog name must be at least 2 characters'),
  breed: z.string().min(1, 'Breed is required'),
  gender: z.string().min(1, 'Gender is required'),
  dateOfBirth: z.string().datetime('Invalid date format').or(z.instanceof(Date)),
  playstyle: z.string().min(1, 'Playstyle is required'),
  size: z.string().min(1, 'Size is required'),
  description: z.string().optional(),
  profilePictureUrl: z.string().url('Invalid URL').optional(),
  vaccinationRecordUrl: z.string().url('Invalid URL').optional(),
});

export type AddDogRequest = z.infer<typeof addDogSchema>;

// For updates, allow partial fields but keep enum/format validation
export const updateDogSchema = addDogSchema.partial();
export type UpdateDogRequest = z.infer<typeof updateDogSchema>;