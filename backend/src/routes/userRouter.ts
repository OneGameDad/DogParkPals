import express from "express";
import userController from "../controllers/userController";

const router = express.Router();

router.post("/users", userController.createUser);
router.get("/users/:email", userController.getUserByEmail);

export default router;