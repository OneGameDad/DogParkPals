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

// Organization Validation Schemas
export const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required').min(2, 'Organization name must be at least 2 characters').max(255, 'Organization name cannot exceed 255 characters'),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
  websiteUrl: z.string().url('Invalid website URL').optional().or(z.literal('')),
});

export type CreateOrganizationRequest = z.infer<typeof createOrganizationSchema>;

export const updateOrganizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters').max(255, 'Organization name cannot exceed 255 characters').optional(),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
  websiteUrl: z.string().url('Invalid website URL').optional().or(z.literal('')),
  profilePictureUrl: z.string().url('Invalid profile picture URL').optional().or(z.literal('')),
});

export type UpdateOrganizationRequest = z.infer<typeof updateOrganizationSchema>;

export const getOrganizationByIdSchema = z.object({
  organizationId: z.number().int().positive('Organization ID must be a positive integer'),
});

export type GetOrganizationByIdRequest = z.infer<typeof getOrganizationByIdSchema>;

export const getOrganizationByNameSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
});

export type GetOrganizationByNameRequest = z.infer<typeof getOrganizationByNameSchema>;

export const addMemberSchema = z.object({
  organizationId: z.number().int().positive('Organization ID must be a positive integer'),
  userId: z.number().int().positive('User ID must be a positive integer'),
  role: z.enum(['MEMBER', 'MODERATOR', 'OWNER']).default('MEMBER'),
});

export type AddMemberRequest = z.infer<typeof addMemberSchema>;

export const removeMemberSchema = z.object({
  organizationId: z.number().int().positive('Organization ID must be a positive integer'),
  userId: z.number().int().positive('User ID must be a positive integer'),
});

export type RemoveMemberRequest = z.infer<typeof removeMemberSchema>;

export const updateMemberRoleSchema = z.object({
  organizationId: z.number().int().positive('Organization ID must be a positive integer'),
  userId: z.number().int().positive('User ID must be a positive integer'),
  role: z.enum(['MEMBER', 'MODERATOR', 'OWNER'], 'Invalid role specified'),
});

export type UpdateMemberRoleRequest = z.infer<typeof updateMemberRoleSchema>;

export const getMemberSchema = z.object({
  organizationId: z.number().int().positive('Organization ID must be a positive integer'),
  userId: z.number().int().positive('User ID must be a positive integer'),
});

export type GetMemberRequest = z.infer<typeof getMemberSchema>;

export const getMembersSchema = z.object({
  organizationId: z.number().int().positive('Organization ID must be a positive integer'),
});

export type GetMembersRequest = z.infer<typeof getMembersSchema>;

export const isMemberSchema = z.object({
  organizationId: z.number().int().positive('Organization ID must be a positive integer'),
  userId: z.number().int().positive('User ID must be a positive integer'),
});

export type IsMemberRequest = z.infer<typeof isMemberSchema>;

// Event Validation Schemas
export const createEventSchema = z.object({
  title: z.string().min(1, 'Event title is required').min(3, 'Event title must be at least 3 characters').max(255, 'Event title cannot exceed 255 characters'),
  description: z.string().max(2000, 'Description cannot exceed 2000 characters').optional(),
  date: z.coerce.date().refine((date) => date > new Date(), 'Event date must be in the future'),
  startTime: z.coerce.date().refine((date) => date > new Date(), 'Event start time must be in the future'),
  endTime: z.coerce.date(),
  parkId: z.number().int().positive('Park ID must be a positive integer'),
  organizerId: z.number().int().positive('Organizer ID must be a positive integer'),
  private: z.enum(['PUBLIC', 'PRIVATE']).default('PUBLIC').optional(),
});

export type CreateEventRequest = z.infer<typeof createEventSchema>;

export const updateEventSchema = z.object({
  title: z.string().min(3, 'Event title must be at least 3 characters').max(255, 'Event title cannot exceed 255 characters').optional(),
  description: z.string().max(2000, 'Description cannot exceed 2000 characters').optional(),
  date: z.coerce.date().optional(),
  startTime: z.coerce.date().optional(),
  endTime: z.coerce.date().optional(),
  parkId: z.number().int().positive('Park ID must be a positive integer').optional(),
  private: z.enum(['PUBLIC', 'PRIVATE']).optional(),
});

export type UpdateEventRequest = z.infer<typeof updateEventSchema>;

export const getEventByIdSchema = z.object({
  eventId: z.number().int().positive('Event ID must be a positive integer'),
});

export type GetEventByIdRequest = z.infer<typeof getEventByIdSchema>;

export const deleteEventSchema = z.object({
  eventId: z.number().int().positive('Event ID must be a positive integer'),
});

export type DeleteEventRequest = z.infer<typeof deleteEventSchema>;

export const getEventsByOrganizerSchema = z.object({
  organizerId: z.number().int().positive('Organizer ID must be a positive integer'),
});

export type GetEventsByOrganizerRequest = z.infer<typeof getEventsByOrganizerSchema>;

export const getEventsByOrganizationSchema = z.object({
  organizationId: z.number().int().positive('Organization ID must be a positive integer'),
});

export type GetEventsByOrganizationRequest = z.infer<typeof getEventsByOrganizationSchema>;

export const getEventsByParkSchema = z.object({
  parkId: z.number().int().positive('Park ID must be a positive integer'),
});

export type GetEventsByParkRequest = z.infer<typeof getEventsByParkSchema>;