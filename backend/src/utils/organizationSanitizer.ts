import { Organization } from "@prisma/client";

type SanitizedOrganization = {
  id: number;
  name: string;
  profilePictureUrl: string | null;
  websiteUrl: string | null;
  description: string | null;
  ownerId?: number;
  createdAt?: Date;
  updatedAt?: Date;
};

// Helper function to sanitize organization data (remove sensitive fields) based on membership level
export const sanitizeOrganization = (
  organization: Organization,
  isMember: boolean,
  memberRole?: string
): SanitizedOrganization => {
  // If the user is a member with OWNER or MODERATOR role, return all scalar fields
  if (isMember && (memberRole === 'OWNER' || memberRole === 'MODERATOR')) {
    return {
      id: organization.id,
      name: organization.name,
      profilePictureUrl: organization.profilePictureUrl,
      websiteUrl: organization.websiteUrl,
      description: organization.description,
      ownerId: organization.ownerId,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
    };
  }
  
  // If the user is a regular member, return public + membership info
  if (isMember && memberRole === 'MEMBER') {
    return {
      id: organization.id,
      name: organization.name,
      profilePictureUrl: organization.profilePictureUrl,
      websiteUrl: organization.websiteUrl,
      description: organization.description,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
    };
  }
  
  // If the user is banned or not a member, return only public fields
  return {
    id: organization.id,
    name: organization.name,
    profilePictureUrl: organization.profilePictureUrl,
    websiteUrl: organization.websiteUrl,
    description: organization.description,
  };
};