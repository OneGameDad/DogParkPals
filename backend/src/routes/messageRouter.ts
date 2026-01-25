import express from "express";
import messageController from "../controllers/messageController";
import { requireAuth } from "../middlewares/authMiddleware";

const router = express.Router();

router.use(requireAuth);
router.get('/unread', messageController.getUnreadMessages);
router.get('/unread/count', messageController.getUnreadCount);
router.post("/:friendId", messageController.sendMessage);
router.get("/:friendId", messageController.getConversation);
router.patch("/:messageId/status", messageController.updateStatus);
router.delete("/:messageId", messageController.deleteMessage);
router.get("/", messageController.getAllMessages);

export default router;