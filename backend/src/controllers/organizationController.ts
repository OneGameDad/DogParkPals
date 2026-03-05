import organizationService from "../services/organizationService";
import express from "express";
import typeSafeLogger from "../utils/typeSafeLogger";
import { ensureString } from "../utils/queryHelpers";
import { toAppError, ConflictError, NotFoundError, ForbiddenError, isAppError } from "../utils/errors";
import { parseValidation } from "../utils/validator";
import { sanitizeOrganization } from "../utils/organizationSanitizer";
import { awardExperience, XP_REWARDS } from "../services/xpService";
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
} from "../utils/validationSchemas";

/**
 * Check if user is authorized to modify an organization (OWNER, MODERATOR or has role ADMIN, DEVELOPER)
 */
async function checkOrganizationAuthorization(organizationId: number, userId: number, userRole: string | undefined) {
  const organization = await organizationService.getOrganizationById(organizationId);
  if (!organization) {
    throw NotFoundError("Organization not found");
  }
  
  const isAdmin = userRole === 'ADMIN' || userRole === 'DEVELOPER';
  
  // Check if user is a member with OWNER or MODERATOR role
  const member = await organizationService.getMember(organizationId, userId);
  const isOwnerOrModerator = member && (member.role === 'OWNER' || member.role === 'MODERATOR');
  
  if (!isAdmin && !isOwnerOrModerator) {
    throw ForbiddenError("Not authorized to modify this organization");
  }
  
  return organization;
}

const organizationController = {
    createOrganization: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to create organization", { method: req.method, path: req.path });
            const { name, description, websiteUrl } = parseValidation(createOrganizationSchema, req.body);
            // TODO: Get userId from authenticated user context instead of req.body
            const userId = req.body.userId || 1; // Temporary until authentication is implemented

            const existingOrg = await organizationService.getOrganizationByName(name);
            if (existingOrg) {
                throw ConflictError("Organization name already in use");
            }

            const newOrg = await organizationService.createOrganization(name, description, websiteUrl);
            
            // Add the creator as OWNER of the organization
            await organizationService.addMember(newOrg.id, userId, 'OWNER');
            await awardExperience(userId, XP_REWARDS.JOIN_ORGANIZATION, 'join_organization');
            
            typeSafeLogger.logUserAction("Organization created", { organizationId: newOrg.id, name, ownerId: userId });
            const sanitized = sanitizeOrganization(newOrg, true, 'OWNER');
            res.status(201).json(sanitized);
        } catch (error) {
            if (isAppError(error)) {
                return next(error);
            }
            return next(
                toAppError(error, { message: "Failed to create organization", code: "INTERNAL_ERROR", statusCode: 500 })
            );
        }
    },

    getOrganizationByName: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to fetch organization by name", { method: req.method, path: req.path });
            const { name } = parseValidation(getOrganizationByNameSchema, req.params);

            const org = await organizationService.getOrganizationByName(name);
            if (!org) {
                throw NotFoundError("Organization not found");
            }
            const userId = (req as any).user?.id;
            const userRole = (req as any).user?.role;
            const memberRole = userId ? (await organizationService.getMember(org.id, userId))?.role : undefined;
            const isMember = memberRole !== undefined;
            typeSafeLogger.logUserAction("Organization retrieved", { organizationId: org.id, name });
            const sanitized = sanitizeOrganization(org, isMember, memberRole);
            res.status(200).json(sanitized);
        } catch (error) {
            if (isAppError(error)) {
                return next(error);
            }
            return next(
                toAppError(error, { message: "Failed to retrieve organization", code: "INTERNAL_ERROR", statusCode: 500 })
            );
        }
    },

    getOrganizationById: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to fetch organization by ID", { method: req.method, path: req.path });
            const { organizationId } = parseValidation(getOrganizationByIdSchema, { organizationId: parseInt(ensureString(req.params.id), 10) });
            const orgId = organizationId;

            const org = await organizationService.getOrganizationById(orgId);
            if (!org) {
                throw NotFoundError("Organization not found");
            }
            const userId = (req as any).user?.id;
            const memberRole = userId ? (await organizationService.getMember(orgId, userId))?.role : undefined;
            const isMember = memberRole !== undefined;
            typeSafeLogger.logUserAction("Organization retrieved", { organizationId: org.id });
            const sanitized = sanitizeOrganization(org, isMember, memberRole);
            res.status(200).json(sanitized);
        } catch (error) {
            if (isAppError(error)) {
                return next(error);
            }
            return next(
                toAppError(error, { message: "Failed to retrieve organization", code: "INTERNAL_ERROR", statusCode: 500 })
            );
        }
    },

    getOrganizations: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to fetch all organizations", { method: req.method, path: req.path });

            const orgs = await organizationService.getOrganizations();
            const userId = (req as any).user?.id;
            const sanitizedOrgs = await Promise.all(
              orgs.map(async (org) => {
                const memberRole = userId ? (await organizationService.getMember(org.id, userId))?.role : undefined;
                const isMember = memberRole !== undefined;
                return sanitizeOrganization(org, isMember, memberRole);
              })
            );
            typeSafeLogger.logUserAction("Organizations retrieved", { organizationCount: orgs.length });
            res.status(200).json(sanitizedOrgs);
        } catch (error) {
            if (isAppError(error)) {
                return next(error);
            }
            return next(
                toAppError(error, { message: "Failed to retrieve organizations", code: "INTERNAL_ERROR", statusCode: 500 })
            );
        }
    },

    updateOrganization: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to update organization", { method: req.method, path: req.path });
            const { organizationId } = parseValidation(getOrganizationByIdSchema, { organizationId: parseInt(ensureString(req.params.id), 10) });
            const orgId = organizationId;
            const userId = (req as any).user?.id || req.body.userId || 1; // TODO: Get from auth context
            const userRole = (req as any).user?.role;
            await checkOrganizationAuthorization(orgId, userId, userRole);
            const { name, description, websiteUrl, profilePictureUrl } = parseValidation(updateOrganizationSchema, req.body);

            const updatedOrg = await organizationService.updateOrganization(orgId, { name, description, websiteUrl, profilePictureUrl });
            const memberRole = (await organizationService.getMember(orgId, userId))?.role;
            typeSafeLogger.logUserAction("Organization updated", { organizationId: updatedOrg.id });
            const sanitized = sanitizeOrganization(updatedOrg, true, memberRole);
            res.status(200).json(sanitized);
        } catch (error) {
            if (isAppError(error)) {
                return next(error);
            }
            return next(
                toAppError(error, { message: "Failed to update organization", code: "INTERNAL_ERROR", statusCode: 500 })
            );
        }
    },

    deleteOrganization: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to delete organization", { method: req.method, path: req.path });
            const { organizationId } = parseValidation(getOrganizationByIdSchema, { organizationId: parseInt(ensureString(req.params.id), 10) });
            const orgId = organizationId;
            const userId = (req as any).user?.id || req.body.userId || 1; // TODO: Get from auth context
            const userRole = (req as any).user?.role;
            await checkOrganizationAuthorization(orgId, userId, userRole);

            await organizationService.deleteOrganization(orgId);
            typeSafeLogger.logUserAction("Organization deleted", { organizationId: orgId });
            res.status(204).send();
        } catch (error) {
            if (isAppError(error)) {
                return next(error);
            }
            return next(
                toAppError(error, { message: "Failed to delete organization", code: "INTERNAL_ERROR", statusCode: 500 })
            );
        }
    },

    addMember: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to add member to organization", { method: req.method, path: req.path });
            const { organizationId, userId, role } = parseValidation(addMemberSchema, { organizationId: parseInt(ensureString(req.params.id), 10), ...req.body });
            const orgId = organizationId;
            const currentUserId = (req as any).user?.id || req.body.currentUserId || 1; // TODO: Get from auth context
            const userRole = (req as any).user?.role;
            await checkOrganizationAuthorization(orgId, currentUserId, userRole);

            await organizationService.addMember(orgId, userId, role);
            await awardExperience(userId, XP_REWARDS.JOIN_ORGANIZATION, 'join_organization');
            typeSafeLogger.logUserAction("Member added to organization", { organizationId: orgId, userId, role });
            res.status(201).send();
        } catch (error) {
            if (isAppError(error)) {
                return next(error);
            }
            return next(
                toAppError(error, { message: "Failed to add member to organization", code: "INTERNAL_ERROR", statusCode: 500 })
            );
        }
    },

    joinOrganization: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to join organization", { method: req.method, path: req.path });
            const userId = (req as any).user?.id;
            if (!userId) {
                throw ForbiddenError("Authentication required");
            }

            const { organizationId } = parseValidation(joinOrganizationSchema, {
                organizationId: parseInt(ensureString(req.params.id), 10),
                userId,
            });

            const member = await organizationService.joinOrganization(organizationId, userId);
            typeSafeLogger.logUserAction("Join request submitted", { organizationId, userId });
            res.status(201).json(member);
        } catch (error) {
            if (isAppError(error)) {
                return next(error);
            }
            return next(
                toAppError(error, { message: "Failed to join organization", code: "INTERNAL_ERROR", statusCode: 500 })
            );
        }
    },
    
    removeMember: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to remove member from organization", { method: req.method, path: req.path });
            const { organizationId, userId: memberId } = parseValidation(removeMemberSchema, { organizationId: parseInt(ensureString(req.params.id), 10), userId: parseInt(ensureString(req.params.memberId), 10) });
            const orgId = organizationId;
            const currentUserId = (req as any).user?.id || req.body.userId || 1; // TODO: Get from auth context
            const userRole = (req as any).user?.role;
            await checkOrganizationAuthorization(orgId, currentUserId, userRole);
            await organizationService.removeMember(orgId, memberId);
            typeSafeLogger.logUserAction("Member removed from organization", { organizationId: orgId, memberId });
            res.status(200).send();
        } catch (error) {
            if (isAppError(error)) {
                return next(error);
            }
            return next(
                toAppError(error, { message: "Failed to remove member from organization", code: "INTERNAL_ERROR", statusCode: 500 })
            );
        }
    },

    updateMemberRole: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to update member role in organization", { method: req.method, path: req.path });
            const { organizationId, userId: memberId, role } = parseValidation(updateMemberRoleSchema, { organizationId: parseInt(ensureString(req.params.id), 10), userId: parseInt(ensureString(req.params.memberId), 10), ...req.body });
            const orgId = organizationId;
            const currentUserId = (req as any).user?.id || req.body.currentUserId || 1; // TODO: Get from auth context
            const userRole = (req as any).user?.role;
            await checkOrganizationAuthorization(orgId, currentUserId, userRole);

            await organizationService.updateMemberRole(orgId, memberId, role, currentUserId);
            typeSafeLogger.logUserAction("Member role updated in organization", { organizationId: orgId, memberId, role });
            res.status(200).send();
        } catch (error) {
            if (isAppError(error)) {
                return next(error);
            }
            return next(
                toAppError(error, { message: "Failed to update member role in organization", code: "INTERNAL_ERROR", statusCode: 500 })
            );
        }
    },

    getMember: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to get member of organization", { method: req.method, path: req.path });
            const { organizationId, userId: memberId } = parseValidation(getMemberSchema, { organizationId: parseInt(ensureString(req.params.id), 10), userId: parseInt(ensureString(req.params.memberId), 10) });
            const orgId = organizationId;

            const member = await organizationService.getMember(orgId, memberId);
            if (!member) {
                throw NotFoundError("Member not found in organization");
            }
            typeSafeLogger.logUserAction("Organization member retrieved", { organizationId: orgId, memberId });
            res.status(200).json(member);
        } catch (error) {
            if (isAppError(error)) {
                return next(error);
            }
            return next(
                toAppError(error, { message: "Failed to retrieve organization member", code: "INTERNAL_ERROR", statusCode: 500 })
            );
        }
    },
    
    getMembers: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to get members of organization", { method: req.method, path: req.path });
            const { organizationId } = parseValidation(getMembersSchema, { organizationId: parseInt(ensureString(req.params.id), 10) });
            const orgId = organizationId;
            
            // Extract query parameters for sorting
            const sortBy = (req.query.sortBy as string) || 'role';
            const order = (req.query.order as 'asc' | 'desc') || 'asc';
            
            const members = await organizationService.getMembers(orgId, sortBy, order);
            typeSafeLogger.logUserAction("Organization members retrieved", { organizationId: orgId, memberCount: members.length, sortBy, order });
            res.status(200).json(members);
        } catch (error) {
            if (isAppError(error)) {
                return next(error);
            }
            return next(
                toAppError(error, { message: "Failed to retrieve organization members", code: "INTERNAL_ERROR", statusCode: 500 })
            );
        }
    },

    isMember: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to check if user is member of organization", { method: req.method, path: req.path });
            const { organizationId, userId } = parseValidation(isMemberSchema, { organizationId: parseInt(ensureString(req.params.id), 10), userId: parseInt(ensureString(req.params.userId), 10) });
            const orgId = organizationId;

            const isMember = await organizationService.isMember(orgId, userId);
            typeSafeLogger.logUserAction("Organization membership check completed", { organizationId: orgId, userId, isMember });
            res.status(200).json({ isMember });
        } catch (error) {
            if (isAppError(error)) {
                return next(error);
            }
            return next(
                toAppError(error, { message: "Failed to check organization membership", code: "INTERNAL_ERROR", statusCode: 500 })
            );
        }
    },

    getOrganizationWithDetails: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to fetch organization with full details", { method: req.method, path: req.path });
            const { organizationId } = parseValidation(getOrganizationByIdSchema, { organizationId: parseInt(ensureString(req.params.id), 10) });
            const orgId = organizationId;

            // Extract query parameters for sorting members
            const sortBy = (req.query.sortBy as string) || 'role';
            const order = (req.query.order as 'asc' | 'desc') || 'asc';

            const details = await organizationService.getOrganizationWithDetails(orgId, sortBy, order);
            if (!details) {
                throw NotFoundError("Organization not found");
            }

            const userId = (req as any).user?.id;
            const userRole = (req as any).user?.role;
            const member = userId ? await organizationService.getMember(orgId, userId) : null;
            const memberRole = member?.role;
            const isMember = memberRole !== undefined;
            const isAdmin = userRole === 'ADMIN' || userRole === 'DEVELOPER';

            // Sanitize base org data
            const sanitized = sanitizeOrganization(details.org, isMember, memberRole);

            // Filter members based on membership level
            let visibleMembers = details.members;
            let visibleEvents = details.events;

            if (!isMember && !isAdmin) {
                // Non-members: only see OWNER info and public events
                visibleMembers = details.members.filter(m => m.role === 'OWNER');
                visibleEvents = details.events.filter(e => e.private === 'PUBLIC');
            } else if (isMember && memberRole === 'MEMBER') {
                // Regular members: see all events
                visibleEvents = details.events;
            }
            // Moderators/Owners/Admins: see all members and events

            // Sanitize member data based on access level
            const sanitizedMembers = visibleMembers.map(m => ({
                userId: m.userId,
                organizationId: m.organizationId,
                role: m.role,
                joinedAt: m.joinedAt,
                user: isMember || isAdmin ? {
                    id: m.user.id,
                    username: m.user.username,
                    first_name: m.user.first_name,
                    last_name: m.user.last_name,
                    profilePictureUrl: m.user.profilePictureUrl,
                } : {
                    id: m.user.id,
                    username: m.user.username,
                },
            }));

            // Sanitize event data based on access level
            const sanitizedEvents = visibleEvents.map(e => ({
                id: e.id,
                title: e.title,
                description: e.description,
                date: e.date,
                startTime: e.startTime,
                endTime: e.endTime,
                private: e.private,
                parkId: e.parkId,
                park: e.park,
                organizerId: e.organizerId,
                organizer: {
                    id: e.organizer.id,
                    username: e.organizer.username,
                    profilePictureUrl: e.organizer.profilePictureUrl,
                },
                ...(isMember || isAdmin ? {
                    createdAt: e.createdAt,
                    updatedAt: e.updatedAt,
                } : {}),
            }));

            typeSafeLogger.logUserAction("Organization with details retrieved", { organizationId: orgId, accessLevel: isMember ? memberRole : (isAdmin ? 'ADMIN' : 'PUBLIC') });
            res.status(200).json({
                ...sanitized,
                members: sanitizedMembers,
                events: sanitizedEvents,
                accessLevel: isMember ? memberRole : (isAdmin ? 'ADMIN' : 'PUBLIC'),
            });
        } catch (error) {
            if (isAppError(error)) {
                return next(error);
            }
            return next(
                toAppError(error, { message: "Failed to retrieve organization details", code: "INTERNAL_ERROR", statusCode: 500 })
            );
        }
    },

    uploadProfilePicture: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to upload organization profile picture", {
              method: req.method,
              path: req.path,
            });

            if (!req.userId) throw ForbiddenError("Authentication required");
            if (!req.file) throw toAppError(new Error("No file uploaded"), {
                      message: "No file uploaded",
                      code: "NO_FILE_UPLOADED",
                    statusCode: 400,
                    });
            
            const organizationId = parseInt(ensureString(req.params.id), 10);
            const userRole = (req as any).user?.role;
            
            // Check authorization
            await checkOrganizationAuthorization(organizationId, req.userId, userRole);
            
            await organizationService.uploadProfilePicture(organizationId, req.file.path);
            const profilePictureUrl = `/api/files/organizations/${organizationId}/profile-picture`;

            res.status(200).json({
              message: "Profile picture uploaded successfully",
              profilePictureUrl,
            });
        } catch (error) {
            if (isAppError(error)) return next(error);

            return next(toAppError(error, {
                message: "Failed to upload profile picture",
                code: "INTERNAL_ERROR",
                statusCode: 500,
              }));
        }
    },

    deleteProfilePicture: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to delete organization profile picture", {
                method: req.method,
                path: req.path,
            });

            if (!req.userId) throw ForbiddenError("Authentication required");
            
            const organizationId = parseInt(ensureString(req.params.id), 10);
            const userRole = (req as any).user?.role;
            
            // Check authorization
            await checkOrganizationAuthorization(organizationId, req.userId, userRole);

            await organizationService.deleteProfilePicture(organizationId);

            res.status(200).json({ message: "Profile picture deleted successfully", });
        } catch (error) {
            if (isAppError(error)) return next(error);

            return next(
                toAppError(error, {
                    message: "Failed to delete profile picture",
                    code: "INTERNAL_ERROR",
                    statusCode: 500,
                }));
        }
    },
};

export default organizationController;