export interface HealthCheckResponse {
  status: string;
}

export const OrgRole = {
  INVITEE: 'INVITEE',
  MEMBER: 'MEMBER',
  MODERATOR: 'MODERATOR',
  OWNER: 'OWNER',
  BANNED: 'BANNED',
} as const;
export type OrgRole = (typeof OrgRole)[keyof typeof OrgRole];

export const FriendshipStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  BLOCKED: 'BLOCKED',
} as const;
export type FriendshipStatus = (typeof FriendshipStatus)[keyof typeof FriendshipStatus];

export const DogSize = {
  TOY: 'TOY',
  SMALL: 'SMALL',
  MEDIUM: 'MEDIUM',
  LARGE: 'LARGE',
  GIANT: 'GIANT',
  KAIJU: 'KAIJU',
} as const;
export type DogSize = (typeof DogSize)[keyof typeof DogSize];

export const DogGender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
} as const;
export type DogGender = (typeof DogGender)[keyof typeof DogGender];

export const DogPlaystyle = {
  SOCIAL: 'SOCIAL',
  SHY: 'SHY',
  AGGRESSIVE: 'AGGRESSIVE',
  ENERGETIC: 'ENERGETIC',
  CALM: 'CALM',
} as const;
export type DogPlaystyle = (typeof DogPlaystyle)[keyof typeof DogPlaystyle];

export const Amenity = {
  WATER_FOUNTAIN: 'WATER_FOUNTAIN',
  SHADE: 'SHADE',
  BENCHES: 'BENCHES',
  WASTE_BAGS: 'WASTE_BAGS',
  OBSTACLES: 'OBSTACLES',
  AGILITY_EQUIPMENT: 'AGILITY_EQUIPMENT',
} as const;
export type Amenity = (typeof Amenity)[keyof typeof Amenity];

export const EventPrivacy = {
  PUBLIC: 'PUBLIC',
  PRIVATE: 'PRIVATE',
} as const;
export type EventPrivacy = (typeof EventPrivacy)[keyof typeof EventPrivacy];

export const AchievementType = {
  BADGE: 'BADGE',
  TROPHY: 'TROPHY',
  CERTIFICATE: 'CERTIFICATE',
} as const;
export type AchievementType = (typeof AchievementType)[keyof typeof AchievementType];

export const UserRole = {
  CLIENT: 'CLIENT',
  DEVELOPER: 'DEVELOPER',
  ADMIN: 'ADMIN',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const MessageStatus = {
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  READ: 'READ',
  ARCHIVED: 'ARCHIVED',
  DELETED: 'DELETED',
} as const;
export type MessageStatus = (typeof MessageStatus)[keyof typeof MessageStatus];



export interface User {
  id: number;
  email: string;
  password_hash: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  profilePictureUrl: string | null;
  resetToken: string | null;
  resetTokenExpiry: string | null;
  latitude: number | null;
  longitude: number | null;
  role: UserRole;
  ExpPoints: number;
  createdAt: string;
  updatedAt: string;
}

export interface Dog {
  id: number;
  name: string;
  breed: DogBreed;
  gender: DogGender;
  fixed: boolean;
  dateOfBirth: string;
  size: DogSize;
  profilePictureUrl: string | null;
  vaccinationRecordUrl: string | null;
  playstyle: DogPlaystyle;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Friendship {
  id: number;
  requesterId: number | null;
  requesterDogId: number | null;
  addresseeId: number | null;
  addresseeDogId: number | null;
  status: FriendshipStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Messages {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  sentAt: string;
  status: MessageStatus;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export type PaginatedMessagesResponse = PaginatedResponse<Messages>;

export interface CursorPaginationMeta {
  hasMore: boolean;
  lastMessageId: number | null;
  limit: number;
}

export interface CursorPaginatedResponse<T> {
  data: T[];
  cursor: CursorPaginationMeta;
}

export type CursorPaginatedMessagesResponse = CursorPaginatedResponse<Messages>;

export interface UnreadCountResponse {
  count: number;
}

export interface CheckIn {
  id: number;
  userId: number;
  dogId: number | null;
  parkId: number;
  checkedInAt: string;
  checkedOutAt: string | null;
  user?: {
    username: string;
    profilePictureUrl: string | null;
  };
  dog?: {
    name: string;
  };
}

export interface Enemies {
  id: number;
  ownerId: number;
  ownerDogId: number | null;
  enemyUserId: number | null;
  enemyDogId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Park {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  description: string | null;
  separateSmallDogArea: boolean;
  amenities: Amenity[];
  profilePictureUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DogOwner {
  userId: number;
  dogId: number;
}

export interface UserFavoritePark {
  userId: number;
  parkId: number;
}

export interface Organization {
  id: number;
  name: string;
  profilePictureUrl: string | null;
  websiteUrl: string | null;
  description: string | null;
  ownerId: number;
  memberRole: OrgRole;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMember {
  userId: number;
  organizationId: number;
  role: OrgRole;
  joinedAt: string;
  user?: {
    id: number;
    username: string;
    first_name: string | null;
    last_name: string | null;
    profilePictureUrl: string | null;
  };
}

export interface Event {
  id: number;
  title: string;
  description: string | null;
  private: EventPrivacy;
  date: string;
  startTime: string;
  endTime: string;
  parkId: number;
  organizationId: number | null;
  organizerId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: number;
  content: string;
  userId: number;
  parkId: number | null;
  eventId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Achievements {
  id: number;
  name: string;
  type: AchievementType;
  description: string | null;
  badgeUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserAchievement {
  userId: number;
  achievementId: number;
  dateEarned: string;
}

export interface Levels {
  id: number;
  name: string;
  description: string | null;
  minPoints: number;
  maxPoints: number;
  badgeUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserLevel {
  userId: number;
  levelId: number;
  dateAchieved: string;
}

export const DogBreed = {
  UNKNOWN: 'UNKNOWN',
  MIXED_BREED: 'MIXED_BREED',
  BARBET: 'BARBET',
  BASSET_HOUND: 'BASSET_HOUND',
  CIRNECO_DELL_ETNA: 'CIRNECO_DELL_ETNA',
  FINNISH_LAPPHUND: 'FINNISH_LAPPHUND',
  GERMAN_SHEPHERD_DOG: 'GERMAN_SHEPHERD_DOG',
} as const;
export type DogBreed = (typeof DogBreed)[keyof typeof DogBreed];