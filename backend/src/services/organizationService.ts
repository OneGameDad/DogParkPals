import { PrismaClient, Prisma, NotificationType } from '@prisma/client';
import typeSafeLogger from '../utils/typeSafeLogger';
import { toAppError } from '../utils/errors';
import notificationService from './notificationService';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  getOrganizationByIdSchema,
  getOrganizationByNameSchema,
  addMemberSchema,
  joinOrganizationSchema,
  removeMemberSchema,
  updateMemberRoleSchema,
  getMemberSchema,
  getMembersSchema,
  isMemberSchema,
} from '../utils/validationSchemas';

const prisma = new PrismaClient();

//TODO organizationService.ts
// Implement organization-related services such as creating organizations, fetching organization details, updating organization info, etc.
const organizationService = {
  
  async getOrganizationById(organizationId: number) {
    const validated = getOrganizationByIdSchema.parse({ organizationId });
    typeSafeLogger.info('Fetching organization by ID', { organizationId: validated.organizationId });
    try {
      const organization = await prisma.organization.findUnique({
        where: { id: validated.organizationId },
      });
      if (organization) {
        typeSafeLogger.logUserAction('Organization found by ID', { organizationId });
      } else {
        typeSafeLogger.warn('Organization not found by ID', { organizationId });
      }
      return organization;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to fetch organization by ID',
        code: 'FETCH_ORGANIZATION_FAILED',
      });
      typeSafeLogger.logError('Failed to fetch organization by ID', appError, { organizationId });
      throw appError;
    }
  },

  async getOrganizationByName(name: string) {
    const validated = getOrganizationByNameSchema.parse({ name });
    typeSafeLogger.info('Fetching organization by name', { name: validated.name });
    try {
      const organization = await prisma.organization.findFirst({
        where: { name: validated.name },
      });
      if (organization) {
        typeSafeLogger.logUserAction('Organization found by name', { name, organizationId: organization.id });
      } else {
        typeSafeLogger.warn('Organization not found by name', { name });
      }
      return organization;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to fetch organization by name',
        code: 'FETCH_ORGANIZATION_FAILED',
      });
      typeSafeLogger.logError('Failed to fetch organization by name', appError, { name });
      throw appError;
    }
  },

  async getOrganizations() {
    typeSafeLogger.info('Fetching all organizations');
    try {
      const organizations = await prisma.organization.findMany();
      typeSafeLogger.logUserAction('Fetched organizations', { count: organizations.length });
      return organizations;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to fetch organizations',
        code: 'FETCH_ORGANIZATIONS_FAILED',
      });
      typeSafeLogger.logError('Failed to fetch organizations', appError);
      throw appError;
    }
  },

  async createOrganization(name: string, description?: string, websiteUrl?: string) {
    const validated = createOrganizationSchema.parse({ name, description, websiteUrl });
    typeSafeLogger.logUserAction('Creating organization', { name: validated.name });
    try {
      const newOrganization = await prisma.organization.create({
        data: {
          name: validated.name,
          description: validated.description,
          websiteUrl: validated.websiteUrl,
          ownerId: 1, // TODO: This should come from authenticated user context
        },
      });
      typeSafeLogger.logUserAction('Organization created successfully', { organizationId: newOrganization.id, name });
      return newOrganization;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to create organization',
        code: 'CREATE_ORGANIZATION_FAILED',
      });
      typeSafeLogger.logError('Failed to create organization', appError, { name });
      throw appError;
    }
  },

  async updateOrganization(organizationId: number, data: Prisma.OrganizationUpdateInput) {
    const validatedId = getOrganizationByIdSchema.parse({ organizationId });
    const validatedData = updateOrganizationSchema.parse(data);
    typeSafeLogger.logUserAction('Updating organization', { organizationId: validatedId.organizationId });
    try {
      const updatedOrganization = await prisma.organization.update({
        where: { id: validatedId.organizationId },
        data: validatedData,
      });
      typeSafeLogger.logUserAction('Organization updated successfully', { organizationId });
      return updatedOrganization;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to update organization',
        code: 'UPDATE_ORGANIZATION_FAILED',
      });
      typeSafeLogger.logError('Failed to update organization', appError, { organizationId });
      throw appError;
    }
  },

  async deleteOrganization(organizationId: number) {
    const validated = getOrganizationByIdSchema.parse({ organizationId });
    typeSafeLogger.logUserAction('Deleting organization', { organizationId: validated.organizationId });
    try {
      await prisma.organization.delete({
        where: { id: validated.organizationId },
      });
      typeSafeLogger.logUserAction('Organization deleted successfully', { organizationId });
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to delete organization',
        code: 'DELETE_ORGANIZATION_FAILED',
      });
      typeSafeLogger.logError('Failed to delete organization', appError, { organizationId });
      throw appError;
    }
  },

  // Member Management Methods
  async joinOrganization(organizationId: number, userId: number) {
    const validated = joinOrganizationSchema.parse({ organizationId, userId });
    typeSafeLogger.logUserAction('Requesting to join organization', { organizationId: validated.organizationId, userId: validated.userId });
    try {
      const member = await prisma.$transaction(async (tx) => {
        const createdMember = await tx.organizationMember.create({
          data: {
            organizationId: validated.organizationId,
            userId: validated.userId,
            role: 'INVITEE',
          },
        });

        const [org, privilegedMembers] = await Promise.all([
          tx.organization.findUnique({
            where: { id: validated.organizationId },
            select: { ownerId: true },
          }),
          tx.organizationMember.findMany({
            where: {
              organizationId: validated.organizationId,
              role: { in: ['OWNER', 'MODERATOR'] },
            },
            select: { userId: true },
          }),
        ]);

        const recipientIds = new Set<number>();
        privilegedMembers.forEach((member) => recipientIds.add(member.userId));
        if (org?.ownerId) {
          recipientIds.add(org.ownerId);
        }
        recipientIds.delete(validated.userId);

        const recipients = Array.from(recipientIds);
        if (recipients.length > 0) {
          await tx.notification.createMany({
            data: recipients.map((recipientId) => ({
              userId: recipientId,
              type: NotificationType.ORGANIZATION_JOIN_REQUEST,
              payload: {
                organizationId: validated.organizationId,
                requesterId: validated.userId,
              },
            })),
          });
        }

        return createdMember;
      });

      typeSafeLogger.logUserAction('Join request created', { organizationId: validated.organizationId, userId: validated.userId });
      return member;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to join organization',
        code: 'JOIN_ORGANIZATION_FAILED',
      });
      typeSafeLogger.logError('Failed to join organization', appError, { organizationId, userId });
      throw appError;
    }
  },

  async addMember(organizationId: number, userId: number, role: 'MEMBER' | 'MODERATOR' | 'OWNER' = 'MEMBER') {
    const validated = addMemberSchema.parse({ organizationId, userId, role });
    typeSafeLogger.logUserAction('Adding member to organization', { organizationId: validated.organizationId, userId: validated.userId, role: validated.role });
    try {
      const member = await prisma.$transaction(async (tx) => {
        const createdMember = await tx.organizationMember.create({
          data: {
            organizationId: validated.organizationId,
            userId: validated.userId,
            role: validated.role,
          },
        });
        await notificationService.createNotification(
          validated.userId,
          NotificationType.ORGANIZATION_JOIN_APPROVED,
          {
            organizationId: validated.organizationId,
            role: validated.role,
          },
          tx
        );
        return createdMember;
      });
      typeSafeLogger.logUserAction('Member added to organization successfully', { organizationId, userId, role });
      return member;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to add member to organization',
        code: 'ADD_MEMBER_FAILED',
      });
      typeSafeLogger.logError('Failed to add member to organization', appError, { organizationId, userId });
      throw appError;
    }
  },

  async removeMember(organizationId: number, userId: number) {
    const validated = removeMemberSchema.parse({ organizationId, userId });
    typeSafeLogger.logUserAction('Removing member from organization', { organizationId: validated.organizationId, userId: validated.userId });
    try {
      await prisma.organizationMember.delete({
        where: {
          userId_organizationId: {
            userId: validated.userId,
            organizationId: validated.organizationId,
          },
        },
      });
      typeSafeLogger.logUserAction('Member removed from organization successfully', { organizationId, userId });
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to remove member from organization',
        code: 'REMOVE_MEMBER_FAILED',
      });
      typeSafeLogger.logError('Failed to remove member from organization', appError, { organizationId, userId });
      throw appError;
    }
  },

  async updateMemberRole(organizationId: number, userId: number, role: 'MEMBER' | 'MODERATOR' | 'OWNER') {
    const validated = updateMemberRoleSchema.parse({ organizationId, userId, role });
    typeSafeLogger.logUserAction('Updating member role', { organizationId: validated.organizationId, userId: validated.userId, role: validated.role });
    try {
      const updatedMember = await prisma.organizationMember.update({
        where: {
          userId_organizationId: {
            userId: validated.userId,
            organizationId: validated.organizationId,
          },
        },
        data: {
          role: validated.role,
        },
      });
      await notificationService.createNotification(
        validated.userId,
        NotificationType.ORGANIZATION_ROLE_UPDATED,
        {
          organizationId: validated.organizationId,
          role: validated.role,
        }
      );
      typeSafeLogger.logUserAction('Member role updated successfully', { organizationId, userId, role });
      return updatedMember;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to update member role',
        code: 'UPDATE_MEMBER_ROLE_FAILED',
      });
      typeSafeLogger.logError('Failed to update member role', appError, { organizationId, userId });
      throw appError;
    }
  },

  async getMember(organizationId: number, userId: number) {
    const validated = getMemberSchema.parse({ organizationId, userId });
    typeSafeLogger.info('Fetching organization member', { organizationId: validated.organizationId, userId: validated.userId });
    try {
      const member = await prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: validated.userId,
            organizationId: validated.organizationId,
          },
        },
      });
      if (member) {
        typeSafeLogger.info('Organization member found', { organizationId, userId, role: member.role });
      } else {
        typeSafeLogger.warn('Organization member not found', { organizationId, userId });
      }
      return member;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to fetch organization member',
        code: 'FETCH_MEMBER_FAILED',
      });
      typeSafeLogger.logError('Failed to fetch organization member', appError, { organizationId, userId });
      throw appError;
    }
  },

  async getMembers(
    organizationId: number,
    sortBy: string = 'role',
    order: 'asc' | 'desc' = 'asc'
  ) {
    const validated = getMembersSchema.parse({ organizationId });
    typeSafeLogger.info('Fetching organization members', { organizationId: validated.organizationId, sortBy, order });
    try {
      const members = await prisma.organizationMember.findMany({
        where: { organizationId: validated.organizationId },
        include: {
          user: true,
        },
      });
      
      const sortedMembers = this.sortMembers(members, sortBy, order);
      
      typeSafeLogger.info('Organization members fetched successfully', { organizationId, count: sortedMembers.length, sortBy, order });
      return sortedMembers;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to fetch organization members',
        code: 'FETCH_MEMBERS_FAILED',
      });
      typeSafeLogger.logError('Failed to fetch organization members', appError, { organizationId });
      throw appError;
    }
  },

  async isMember(organizationId: number, userId: number): Promise<boolean> {
    const validated = isMemberSchema.parse({ organizationId, userId });
    typeSafeLogger.info('Checking if user is organization member', { organizationId: validated.organizationId, userId: validated.userId });
    try {
      const member = await prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: validated.userId,
            organizationId: validated.organizationId,
          },
        },
      });
      const isMember = !!member;
      typeSafeLogger.info('User membership check completed', { organizationId, userId, isMember });
      return isMember;
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to check user membership',
        code: 'CHECK_MEMBERSHIP_FAILED',
      });
      typeSafeLogger.logError('Failed to check user membership', appError, { organizationId, userId });
      throw appError;
    }
  },

  async getOrganizationWithDetails(
    organizationId: number,
    sortBy: string = 'role',
    order: 'asc' | 'desc' = 'asc'
  ) {
    const validated = getOrganizationByIdSchema.parse({ organizationId });
    typeSafeLogger.info('Fetching organization with details', { organizationId: validated.organizationId, sortBy, order });
    try {
      const org = await prisma.organization.findUnique({
        where: { id: validated.organizationId },
      });

      if (!org) {
        typeSafeLogger.warn('Organization not found for details fetch', { organizationId });
        return null;
      }

      const [members, events] = await Promise.all([
        prisma.organizationMember.findMany({
          where: { organizationId: validated.organizationId },
          include: { user: true },
        }),
        prisma.event.findMany({
          where: { organizationId: validated.organizationId },
          include: { organizer: true, park: true },
        }),
      ]);

      const sortedMembers = this.sortMembers(members, sortBy, order);

      typeSafeLogger.info('Organization details fetched successfully', { organizationId, memberCount: sortedMembers.length, eventCount: events.length, sortBy, order });
      return { org, members: sortedMembers, events };
    } catch (error) {
      const appError = toAppError(error, {
        message: 'Failed to fetch organization with details',
        code: 'FETCH_ORGANIZATION_DETAILS_FAILED',
      });
      typeSafeLogger.logError('Failed to fetch organization with details', appError, { organizationId });
      throw appError;
    }
  },

  // Helper function to sort members by various criteria
  sortMembers(
    members: any[],
    sortBy: string = 'role',
    order: 'asc' | 'desc' = 'asc'
  ): any[] {
    const direction = order === 'asc' ? 1 : -1;
    const roleOrder: Record<string, number> = {
      INVITEE: 1,
      MEMBER: 2,
      MODERATOR: 3,
      OWNER: 4,
      BANNED: 5,
    };

    return [...members].sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'role') {
        const orderA = roleOrder[a.role] ?? 0;
        const orderB = roleOrder[b.role] ?? 0;
        comparison = orderA - orderB;
      } else if (sortBy === 'joinedAt') {
        comparison = new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
      } else if (sortBy === 'username' && a.user && b.user) {
        comparison = a.user.username.localeCompare(b.user.username);
      } else if (sortBy === 'email' && a.user && b.user) {
        comparison = a.user.email.localeCompare(b.user.email);
      }

      return comparison * direction;
    });
  },
};

export default organizationService;