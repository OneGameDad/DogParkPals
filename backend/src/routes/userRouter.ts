import express from "express";
import userController from "../controllers/userController";

const router = express.Router();

router.post("/users", (req, res, next) => userController.createUser(req, res, next));
router.get("/users/:email", (req, res, next) => userController.getUserByEmail(req, res, next));

export default router;