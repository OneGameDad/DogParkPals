import fs from "fs";
import path from "path";
import express from "express";
import { toAppError } from "../utils/errors";
import { checkDogAuthorization } from "./dogController";
import dogService from "../services/dogService";
import userService from "../services/userServices";

const router = express.Router();

router.get("/dogs/:dogId/photo", async (req, res, next) => {
  try {
    const dogId = parseInt(req.params.dogId, 10);
    const userId = req.userId;
    const userRole = req.user?.role;

    // Ensure user can access this dog's files
    await checkDogAuthorization(dogId, userId, userRole);

    // Get the file path from DB
    const dog = await dogService.getDogById(dogId);
    if (!dog?.profilePictureUrl) {
      return res.status(404).json({ message: "Dog photo not found" });
    }

    const url = `/api/files/dogs/${dogId}/photo`;

    res.status(200).json({ url });
  } catch (err) {
    next(toAppError(err, { message: "Failed to fetch dog photo", code: "FILE_ACCESS_DENIED" }));
  }
});

router.get("/dogs/:dogId/document", async (req, res, next) => {
  try {
    const dogId = parseInt(req.params.dogId, 10);
    const userId = req.userId;
    const userRole = req.user?.role;

    await checkDogAuthorization(dogId, userId, userRole);

    const dog = await dogService.getDogById(dogId);
    if (!dog?.vaccinationRecordUrl) {
      return res.status(404).json({ message: "Document not found" });
    }

    const url = `/api/files/dogs/${dogId}/document`;
    res.status(200).json({ url });
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
    const requestedUserId = parseInt(req.params.userId, 10);
    const requesterId = req.userId;
    const requesterRole = req.user?.role;

    if (requestedUserId !== requesterId && requesterRole !== "ADMIN") {
      return res.status(403).json({ message: "Access denied" });
    }

    const user = await userService.getUserById(requestedUserId);
    if (!user?.profilePictureUrl) {
      return res.status(404).json({ message: "Profile picture not found" });
    }

    const url = `/api/files/users/${requestedUserId}/profile-picture`;
    res.status(200).json({ url });
  } catch (err) {
    next(
      toAppError(err, {
        message: "Failed to fetch profile picture",
        code: "FILE_ACCESS_DENIED",
      })
    );
  }
});

export default router;