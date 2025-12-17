import organizationService from "../services/organizationService";
import express from "express";
import typeSafeLogger from "../utils/typeSafeLogger";
import { toAppError, ConflictError, NotFoundError, ForbiddenError } from "../utils/errors";
import { parseValidation } from "../utils/validator";
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  getOrganizationByIdSchema,
  getOrganizationByNameSchema,
  addMemberSchema,
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
            
            typeSafeLogger.logUserAction("Organization created", { organizationId: newOrg.id, name, ownerId: userId });
            res.status(201).json(newOrg);
        } catch (error) {
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
            typeSafeLogger.logUserAction("Organization retrieved", { organizationId: org.id, name });
            res.status(200).json(org);
        } catch (error) {
            return next(
                toAppError(error, { message: "Failed to retrieve organization", code: "INTERNAL_ERROR", statusCode: 500 })
            );
        }
    },

    getOrganizationById: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to fetch organization by ID", { method: req.method, path: req.path });
            const { organizationId } = parseValidation(getOrganizationByIdSchema, { organizationId: parseInt(req.params.id, 10) });
            const orgId = organizationId;

            const org = await organizationService.getOrganizationById(orgId);
            if (!org) {
                throw NotFoundError("Organization not found");
            }
            typeSafeLogger.logUserAction("Organization retrieved", { organizationId: org.id });
            res.status(200).json(org);
        } catch (error) {
            return next(
                toAppError(error, { message: "Failed to retrieve organization", code: "INTERNAL_ERROR", statusCode: 500 })
            );
        }
    },

    getOrganizations: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to fetch all organizations", { method: req.method, path: req.path });

            const orgs = await organizationService.getOrganizations();
            typeSafeLogger.logUserAction("Organizations retrieved", { organizationCount: orgs.length });
            res.status(200).json(orgs);
        } catch (error) {
            return next(
                toAppError(error, { message: "Failed to retrieve organizations", code: "INTERNAL_ERROR", statusCode: 500 })
            );
        }
    },

    updateOrganization: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to update organization", { method: req.method, path: req.path });
            const { organizationId } = parseValidation(getOrganizationByIdSchema, { organizationId: parseInt(req.params.id, 10) });
            const orgId = organizationId;
            const userId = (req as any).user?.id || req.body.userId || 1; // TODO: Get from auth context
            const userRole = (req as any).user?.role;
            await checkOrganizationAuthorization(orgId, userId, userRole);
            const { name, description, websiteUrl, profilePictureUrl } = parseValidation(updateOrganizationSchema, req.body);

            const updatedOrg = await organizationService.updateOrganization(orgId, { name, description, websiteUrl, profilePictureUrl });
            typeSafeLogger.logUserAction("Organization updated", { organizationId: updatedOrg.id });
            res.status(200).json(updatedOrg);
        } catch (error) {
            return next(
                toAppError(error, { message: "Failed to update organization", code: "INTERNAL_ERROR", statusCode: 500 })
            );
        }
    },

    deleteOrganization: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to delete organization", { method: req.method, path: req.path });
            const { organizationId } = parseValidation(getOrganizationByIdSchema, { organizationId: parseInt(req.params.id, 10) });
            const orgId = organizationId;
            const userId = (req as any).user?.id || req.body.userId || 1; // TODO: Get from auth context
            const userRole = (req as any).user?.role;
            await checkOrganizationAuthorization(orgId, userId, userRole);

            await organizationService.deleteOrganization(orgId);
            typeSafeLogger.logUserAction("Organization deleted", { organizationId: orgId });
            res.status(204).send();
        } catch (error) {
            return next(
                toAppError(error, { message: "Failed to delete organization", code: "INTERNAL_ERROR", statusCode: 500 })
            );
        }
    },

    addMember: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to add member to organization", { method: req.method, path: req.path });
            const { organizationId, userId, role } = parseValidation(addMemberSchema, { organizationId: parseInt(req.params.id, 10), ...req.body });
            const orgId = organizationId;
            const currentUserId = (req as any).user?.id || req.body.currentUserId || 1; // TODO: Get from auth context
            const userRole = (req as any).user?.role;
            await checkOrganizationAuthorization(orgId, currentUserId, userRole);

            await organizationService.addMember(orgId, userId, role);
            typeSafeLogger.logUserAction("Member added to organization", { organizationId: orgId, userId, role });
            res.status(201).send();
        } catch (error) {
            return next(
                toAppError(error, { message: "Failed to add member to organization", code: "INTERNAL_ERROR", statusCode: 500 })
            );
        }
    },
    
    removeMember: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to remove member from organization", { method: req.method, path: req.path });
            const { organizationId, userId: memberId } = parseValidation(removeMemberSchema, { organizationId: parseInt(req.params.id, 10), userId: parseInt(req.params.memberId, 10) });
            const orgId = organizationId;
            const currentUserId = (req as any).user?.id || req.body.userId || 1; // TODO: Get from auth context
            const userRole = (req as any).user?.role;
            await checkOrganizationAuthorization(orgId, currentUserId, userRole);
            await organizationService.removeMember(orgId, memberId);
            typeSafeLogger.logUserAction("Member removed from organization", { organizationId: orgId, memberId });
            res.status(200).send();
        } catch (error) {
            return next(
                toAppError(error, { message: "Failed to remove member from organization", code: "INTERNAL_ERROR", statusCode: 500 })
            );
        }
    },

    updateMemberRole: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to update member role in organization", { method: req.method, path: req.path });
            const { organizationId, userId: memberId, role } = parseValidation(updateMemberRoleSchema, { organizationId: parseInt(req.params.id, 10), userId: parseInt(req.params.memberId, 10), ...req.body });
            const orgId = organizationId;
            const currentUserId = (req as any).user?.id || req.body.currentUserId || 1; // TODO: Get from auth context
            const userRole = (req as any).user?.role;
            await checkOrganizationAuthorization(orgId, currentUserId, userRole);

            await organizationService.updateMemberRole(orgId, memberId, role);
            typeSafeLogger.logUserAction("Member role updated in organization", { organizationId: orgId, memberId, role });
            res.status(200).send();
        } catch (error) {
            return next(
                toAppError(error, { message: "Failed to update member role in organization", code: "INTERNAL_ERROR", statusCode: 500 })
            );
        }
    },

    getMember: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to get member of organization", { method: req.method, path: req.path });
            const { organizationId, userId: memberId } = parseValidation(getMemberSchema, { organizationId: parseInt(req.params.id, 10), userId: parseInt(req.params.memberId, 10) });
            const orgId = organizationId;

            const member = await organizationService.getMember(orgId, memberId);
            if (!member) {
                throw NotFoundError("Member not found in organization");
            }
            typeSafeLogger.logUserAction("Organization member retrieved", { organizationId: orgId, memberId });
            res.status(200).json(member);
        } catch (error) {
            return next(
                toAppError(error, { message: "Failed to retrieve organization member", code: "INTERNAL_ERROR", statusCode: 500 })
            );
        }
    },
    
    getMembers: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to get members of organization", { method: req.method, path: req.path });
            const { organizationId } = parseValidation(getMembersSchema, { organizationId: parseInt(req.params.id, 10) });
            const orgId = organizationId;
            const members = await organizationService.getMembers(orgId);
            typeSafeLogger.logUserAction("Organization members retrieved", { organizationId: orgId, memberCount: members.length });
            res.status(200).json(members);
        } catch (error) {
            return next(
                toAppError(error, { message: "Failed to retrieve organization members", code: "INTERNAL_ERROR", statusCode: 500 })
            );
        }
    },

    isMember: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            typeSafeLogger.logRequest("Received request to check if user is member of organization", { method: req.method, path: req.path });
            const { organizationId, userId } = parseValidation(isMemberSchema, { organizationId: parseInt(req.params.id, 10), userId: parseInt(req.params.userId, 10) });
            const orgId = organizationId;

            const isMember = await organizationService.isMember(orgId, userId);
            typeSafeLogger.logUserAction("Organization membership check completed", { organizationId: orgId, userId, isMember });
            res.status(200).json({ isMember });
        } catch (error) {
            return next(
                toAppError(error, { message: "Failed to check organization membership", code: "INTERNAL_ERROR", statusCode: 500 })
            );
        }
    },
};

export default organizationController;