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

export const createFriendRequestSchema = z.object({
  requesterId: z.number().int().positive('Requester ID must be a positive integer').optional(),
  addresseeId: z.number().int().positive('Addressee ID must be a positive integer').optional(),
  requesterDogId: z.number().int().positive('Requester Dog ID must be a positive integer').optional(),
  addresseeDogId: z.number().int().positive('Addressee Dog ID must be a positive integer').optional(),
}).refine(
  (data) => {
    // At least one requester (user or dog) must be provided
    const hasRequester = data.requesterId || data.requesterDogId;
    // At least one addressee (user or dog) must be provided
    const hasAddressee = data.addresseeId || data.addresseeDogId;
    return hasRequester && hasAddressee;
  },
  {
    message: 'Both requester and addressee must be specified (either as user or dog)',
  }
).refine(
  (data) => {
    // Cannot friend yourself
    if (data.requesterId && data.addresseeId && data.requesterId === data.addresseeId) {
      return false;
    }
    // Cannot friend the same dog
    if (data.requesterDogId && data.addresseeDogId && data.requesterDogId === data.addresseeDogId) {
      return false;
    }
    return true;
  },
  {
    message: 'Cannot create friendship with yourself/same entity',
    path: ['addresseeId'],
  }
);

export type CreateFriendRequest = z.infer<typeof createFriendRequestSchema>;

export const respondToFriendRequestSchema = z.object({
  friendshipId: z.number().int().positive('Friendship ID must be a positive integer'),
  accept: z.boolean(),
});

export type RespondToFriendRequest = z.infer<typeof respondToFriendRequestSchema>;

export const getUserIdSchema = z.object({
  userId: z.number().int().positive('User ID must be a positive integer'),
});

export type GetUserIdRequest = z.infer<typeof getUserIdSchema>;

export const removeFriendSchema = z.object({
  userId: z.number().int().positive('User ID must be a positive integer').optional(),
  friendId: z.number().int().positive('Friend ID must be a positive integer').optional(),
  dogId: z.number().int().positive('Dog ID must be a positive integer').optional(),
  friendDogId: z.number().int().positive('Friend Dog ID must be a positive integer').optional(),
}).refine(
  (data) => {
    // At least one entity (user or dog) must be provided
    const hasEntity = data.userId || data.dogId;
    // At least one friend (user or dog) must be provided
    const hasFriend = data.friendId || data.friendDogId;
    return hasEntity && hasFriend;
  },
  {
    message: 'Both entity and friend must be specified (either as user or dog)',
  }
).refine(
  (data) => {
    // Cannot remove yourself
    if (data.userId && data.friendId && data.userId === data.friendId) {
      return false;
    }
    // Cannot remove the same dog
    if (data.dogId && data.friendDogId && data.dogId === data.friendDogId) {
      return false;
    }
    return true;
  },
  {
    message: 'Cannot remove friendship with yourself/same entity',
    path: ['friendId'],
  }
);

export type RemoveFriendRequest = z.infer<typeof removeFriendSchema>;

export const friendshipIdSchema = z.object({
  friendshipId: z.number().int().positive('Friendship ID must be a positive integer'),
});

export type FriendshipIdRequest = z.infer<typeof friendshipIdSchema>;

export const getFriendsSchema = z.object({
  userId: z.number().int().positive('User ID must be a positive integer').optional(),
  dogId: z.number().int().positive('Dog ID must be a positive integer').optional(),
}).refine(
  (data) => data.userId || data.dogId,
  {
    message: 'Either userId or dogId must be provided',
  }
);

export type GetFriendsRequest = z.infer<typeof getFriendsSchema>;

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