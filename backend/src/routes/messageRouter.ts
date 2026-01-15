import express from "express";
import parkController from "../controllers/messageController";
import messageController from "../controllers/messageController";
import { requireAuth } from "../middlewares/authMiddleware";

const router = express.Router();

router.use(requireAuth);
router.post("/:friendId", messageController.sendMessage);
router.get("/:friendId", messageController.getConversation);
router.get("/", messageController.getAllMessages);
router.patch("/:messageId/status", messageController.updateStatus);
router.delete("/:messageId", messageController.deleteMessage);
router.get('/messages/unread', messageController.getUnreadMessages);
router.get('/messages/unread/count', messageController.getUnreadCount);

export default router;