import userService from "../services/userServices";
import express from "express";
import type { User } from "@prisma/client";
import { sanitizeUser } from "../utils/userSanitizer";

const userController = {
    createUser: async (req: express.Request, res: express.Response) => {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        if (password.length < 8) {
            return res.status(400).json({ error: "Password must be at least 8 characters long" });
        }
        if (await userService.getUserByEmail(email)) {
            return res.status(409).json({ error: "Email already in use" });
        }
        try {
            const newUser = await userService.createUser(username, email, password);
            res.status(201).json(sanitizeUser(newUser));
        } catch (error) {
            res.status(500).json({ error: "Failed to create user" });
        }
    },

    getUserByEmail: async (req: express.Request, res: express.Response) => {
        const { email } = req.params;
        try {
            const user = await userService.getUserByEmail(email);
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }
            res.status(200).json(sanitizeUser(user));
        } catch (error) {
            res.status(500).json({ error: "Failed to retrieve user" });
        }
    }
};

export default userController;