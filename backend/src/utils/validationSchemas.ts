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

export const createParkSchema = z.object({
  name: z.string().min(1, 'Park name is required'),
  latitude: z.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90'),
  longitude: z.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180'),
  description: z.string().optional(),
  separateSmallDogArea: z.boolean().optional(),
  amenities: z.array(z.string()).optional(),
});

export type CreateParkRequest = z.infer<typeof createParkSchema>;

export const updateParkSchema = z.object({
  name: z.string().min(1, 'Park name is required').optional(),
  latitude: z.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90').optional(),
  longitude: z.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180').optional(),
  description: z.string().optional(),
  separateSmallDogArea: z.boolean().optional(),
  amenities: z.array(z.string()).optional(),
});

export type UpdateParkRequest = z.infer<typeof updateParkSchema>;

export const getParksNearLocationSchema = z.object({
  latitude: z.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90'),
  longitude: z.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180'),
  radiusInKm: z.number().min(0.1, 'Radius must be at least 0.1 km').max(20000, 'Radius cannot exceed 20000 km'),
});

export type GetParksNearLocationRequest = z.infer<typeof getParksNearLocationSchema>;