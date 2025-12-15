import userService from "../services/userServices";
import express from "express";
import { sanitizeUser } from "../utils/userSanitizer";
import logger from "../utils/logger";

const userController = {
    createUser: async (req: express.Request, res: express.Response) => {
        const { username, email, password } = req.body;
        logger.info("Received request to create user", { username, email });
        if (!username || !email || !password) {
            logger.warn("Create user validation failed: missing fields", { username, email });
            return res.status(400).json({ error: "Missing required fields" });
        }
        if (password.length < 8) {
            logger.warn("Create user validation failed: password too short", { username, email });
            return res.status(400).json({ error: "Password must be at least 8 characters long" });
        }
        if (await userService.getUserByEmail(email)) {
            logger.warn("Create user conflict: email already in use", { email });
            return res.status(409).json({ error: "Email already in use" });
        }
        try {
            const newUser = await userService.createUser(username, email, password);
            logger.info("User created", { userId: newUser.id, email });
            res.status(201).json(sanitizeUser(newUser));
        } catch (error) {
            logger.error("Create user failed", { email, error });
            res.status(500).json({ error: "Failed to create user" });
        }
    },

    getUserByEmail: async (req: express.Request, res: express.Response) => {
        const { email } = req.params;
        logger.info("Received request to fetch user by email", { email });
        try {
            const user = await userService.getUserByEmail(email);
            if (!user) {
                logger.warn("User not found", { email });
                return res.status(404).json({ error: "User not found" });
            }
            logger.info("User retrieved", { userId: user.id, email });
            res.status(200).json(sanitizeUser(user));
        } catch (error) {
            logger.error("Failed to retrieve user", { email, error });
            res.status(500).json({ error: "Failed to retrieve user" });
        }
    }
};

export default userController;