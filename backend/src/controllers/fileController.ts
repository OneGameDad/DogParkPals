import fs from "fs";
import path from "path";
import express from "express";
import { toAppError } from "../utils/errors";
import { ensureString } from "../utils/queryHelpers";
import { checkDogAuthorization } from "./dogController";
import dogService from "../services/dogService";
import userService from "../services/userServices";
import organizationService from "../services/organizationService";

const router = express.Router();

const resolveStoredPath = (storedPath: string) => {
  if (path.isAbsolute(storedPath)) {
    return storedPath;
  }
  return path.join(__dirname, "../../", storedPath);
};

router.get("/dogs/:dogId/photo", async (req, res, next) => {
  try {
    const dogId = parseInt(ensureString(req.params.dogId), 10);
    const userId = req.userId;
    const userRole = req.user?.role;

    // Only dog owner or admin/developer can view dog photos
    await checkDogAuthorization(dogId, userId, userRole);

    const dog = await dogService.getDogById(dogId);
    if (!dog?.profilePictureUrl) {
      return res.status(404).json({ message: "Dog photo not found" });
    }

    const resolvedPath = resolveStoredPath(dog.profilePictureUrl);
    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({ message: "Dog photo not found" });
    }

    res.sendFile(resolvedPath);
  } catch (err) {
    next(toAppError(err, { message: "Failed to fetch dog photo", code: "FILE_ACCESS_DENIED" }));
  }
});

router.get("/dogs/:dogId/document", async (req, res, next) => {
  try {
    const dogId = parseInt(ensureString(req.params.dogId), 10);
    const userId = req.userId;
    const userRole = req.user?.role;

    // Only dog owner or admin/developer can view vaccination records
    await checkDogAuthorization(dogId, userId, userRole);

    const dog = await dogService.getDogById(dogId);
    if (!dog?.vaccinationRecordUrl) {
      return res.status(404).json({ message: "Document not found" });
    }

    const resolvedPath = resolveStoredPath(dog.vaccinationRecordUrl);
    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({ message: "Document not found" });
    }

    res.sendFile(resolvedPath);
  } catch (err) {
    next(
      toAppError(err, {
        message: "Failed to fetch document",
        code: "FILE_ACCESS_DENIED",
      })
    );
  }
});

router.get("/users/:userId/profile-picture", async (req, res, next) => {
  try {
    const requestedUserId = parseInt(ensureString(req.params.userId), 10);
    const currentUserId = req.userId;
    const userRole = req.user?.role;

    // Only the user themselves or admin/developer can view profile pictures
    const isOwnProfile = currentUserId === requestedUserId;
    const isAdmin = userRole === 'ADMIN' || userRole === 'DEVELOPER';
    
    if (!isOwnProfile && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to access this profile picture" });
    }

    const user = await userService.getUserById(requestedUserId);
    if (!user?.profilePictureUrl) {
      return res.status(404).json({ message: "Profile picture not found" });
    }

    const resolvedPath = resolveStoredPath(user.profilePictureUrl);
    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({ message: "Profile picture not found" });
    }

    res.sendFile(resolvedPath);
  } catch (err) {
    next(
      toAppError(err, {
        message: "Failed to fetch profile picture",
        code: "FILE_ACCESS_DENIED",
      })
    );
  }
});

router.get("/organizations/:organizationId/profile-picture", async (req, res, next) => {
  try {
    const organizationId = parseInt(ensureString(req.params.organizationId), 10);

    // Route is authentication-protected in fileRouter
    const organization = await organizationService.getOrganizationById(organizationId);
    if (!organization?.profilePictureUrl) {
      return res.status(404).json({ message: "Organization profile picture not found" });
    }

    const resolvedPath = resolveStoredPath(organization.profilePictureUrl);
    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({ message: "Organization profile picture not found" });
    }

    res.sendFile(resolvedPath);
  } catch (err) {
    next(
      toAppError(err, {
        message: "Failed to fetch organization profile picture",
        code: "FILE_ACCESS_DENIED",
      })
    );
  }
});

export default router;