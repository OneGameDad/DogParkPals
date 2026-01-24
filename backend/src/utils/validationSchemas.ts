import { z } from 'zod';

export const createUserSchema = z.object({
  username: z.string().min(1, 'Username is required').min(3, 'Username must be at least 3 characters'),
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  password: z.string().min(1, 'Password is required').min(8, 'Password must be at least 8 characters long'),
});

export type CreateUserRequest = z.infer<typeof createUserSchema>;

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginRequest = z.infer<typeof loginSchema>;

export const getUserByEmailSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
});

export type GetUserByEmailRequest = z.infer<typeof getUserByEmailSchema>;

export const getUserByIdSchema = z.object({
  id: z.coerce.number().int().positive('User ID must be a positive integer'),
});

export type GetUserByIdRequest = z.infer<typeof getUserByIdSchema>;

export const getUserByUsernameSchema = z.object({
  username: z.string().min(1, 'Username is required'),
});

export type GetUserByUsernameRequest = z.infer<typeof getUserByUsernameSchema>;

export const listUsersSchema = z.object({
  page: z.coerce.number().int().positive('Page must be a positive integer').optional(),
  pageSize: z.coerce
    .number()
    .int()
    .positive('Page size must be a positive integer')
    .max(100, 'Page size cannot exceed 100')
    .optional(),
});

export type ListUsersRequest = z.infer<typeof listUsersSchema>;

export const deleteUserSchema = z.object({
  id: z.coerce.number().int().positive('User ID must be a positive integer'),
});

export type DeleteUserRequest = z.infer<typeof deleteUserSchema>;

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(8, 'Old password must be at least 8 characters'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;

export const resetUserPasswordSchema = z.object({
  userId: z.coerce.number().int().positive('User ID must be a positive integer'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters long'),
});

export type ResetUserPasswordRequest = z.infer<typeof resetUserPasswordSchema>;

export const updateUserProfileSchema = z
  .object({
    first_name: z.string().min(1, 'First name is required').nullable().optional(),
    last_name: z.string().min(1, 'Last name is required').nullable().optional(),
    profilePictureUrl: z.string().url('Invalid profile picture URL').nullable().optional(),
    latitude: z.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90').nullable().optional(),
    longitude: z
      .number()
      .min(-180, 'Longitude must be between -180 and 180')
      .max(180, 'Longitude must be between -180 and 180')
      .nullable()
      .optional(),
  })
  .refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    { message: 'At least one field must be provided to update the profile' }
  );

export type UpdateUserProfileRequest = z.infer<typeof updateUserProfileSchema>;

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
  confirmRemoveEnemy: z.boolean().optional(),
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

export const sendMessageSchema = z.object({
  senderId: z.number().int().positive('Sender ID must be a positive integer'),
  receiverId: z.number().int().positive('Receiver ID must be a positive integer'),
  content: z.string().min(1, 'Message content cannot be empty').max(1000, 'Message too long'), // TODO: ideal message length?
}).refine((data) => data.senderId !== data.receiverId, {
  message: 'Sender cannot message themselves',
  path: ['receiverId'],
});

export type SendMessageRequest = z.infer<typeof sendMessageSchema>;

export const updateMessageStatusSchema = z.object({
  status: z.enum(['SENT', 'DELIVERED', 'READ', 'ARCHIVED', 'DELETED'], {
    message: 'Invalid status value',
  }),
});

export type UpdateMessageStatusRequest = z.infer<typeof updateMessageStatusSchema>;

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

export const addOwnerToDogSchema = z.object({
  userId: z.number().int().positive('User ID must be a positive integer'),
});
export type AddOwnerToDogRequest = z.infer<typeof addOwnerToDogSchema>;

export const removeOwnerFromDogSchema = z.object({
  userId: z.number().int().positive('User ID must be a positive integer'),
});
export type RemoveOwnerFromDogRequest = z.infer<typeof removeOwnerFromDogSchema>;

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
}).refine((data) => data.endTime.getTime() - data.startTime.getTime() >= 30 * 60 * 1000, {
  message: 'Event must be at least 30 minutes long',
  path: ['endTime'],
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
}).refine((data) => {
  if (data.startTime && data.endTime) {
    return data.endTime.getTime() - data.startTime.getTime() >= 30 * 60 * 1000;
  }
  return true;
}, {
  message: 'Event must be at least 30 minutes long',
  path: ['endTime'],
});

export type UpdateEventRequest = z.infer<typeof updateEventSchema>;

export const getEventByIdSchema = z.object({
  eventId: z.coerce.number().int().positive('Event ID must be a positive integer'),
});

export type GetEventByIdRequest = z.infer<typeof getEventByIdSchema>;

export const deleteEventSchema = z.object({
  eventId: z.coerce.number().int().positive('Event ID must be a positive integer'),
});

export type DeleteEventRequest = z.infer<typeof deleteEventSchema>;

export const getEventsByOrganizerSchema = z.object({
  organizerId: z.coerce.number().int().positive('Organizer ID must be a positive integer'),
});

export type GetEventsByOrganizerRequest = z.infer<typeof getEventsByOrganizerSchema>;

export const getEventsByOrganizationSchema = z.object({
  organizationId: z.coerce.number().int().positive('Organization ID must be a positive integer'),
});

export type GetEventsByOrganizationRequest = z.infer<typeof getEventsByOrganizationSchema>;

export const getEventsByParkSchema = z.object({
  parkId: z.coerce.number().int().positive('Park ID must be a positive integer'),
});

export type GetEventsByParkRequest = z.infer<typeof getEventsByParkSchema>;

// Achievement Validation Schemas
export const createAchievementSchema = z.object({
  name: z.string().min(1, 'Achievement name is required').min(2, 'Achievement name must be at least 2 characters').max(255, 'Achievement name cannot exceed 255 characters'),
  type: z.enum(['BADGE', 'TROPHY', 'CERTIFICATE']).optional(),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
  badgeUrl: z.string().url('Invalid badge URL').optional(),
});

export type CreateAchievementRequest = z.infer<typeof createAchievementSchema>;

export const updateAchievementSchema = z.object({
  name: z.string().min(2, 'Achievement name must be at least 2 characters').max(255, 'Achievement name cannot exceed 255 characters').optional(),
  type: z.enum(['BADGE', 'TROPHY', 'CERTIFICATE']).optional(),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
  badgeUrl: z.string().url('Invalid badge URL').optional(),
});

export type UpdateAchievementRequest = z.infer<typeof updateAchievementSchema>;

export const getAchievementByNameSchema = z.object({
  name: z.string().min(1, 'Achievement name is required'),
});

export const awardAchievementSchema = z.object({
  userId: z.coerce.number().int().positive('User ID must be a positive integer'),
  achievementId: z.coerce.number().int().positive('Achievement ID must be a positive integer'),
});

export type AwardAchievementRequest = z.infer<typeof awardAchievementSchema>;