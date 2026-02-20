import express from "express";
import messageController from "../controllers/messageController";
import { requireAuth } from "../middlewares/authMiddleware";

const router = express.Router();

router.use(requireAuth);

// Specific routes with exact paths
router.get('/unread/count', messageController.getUnreadCount);
router.get('/unread', messageController.getUnreadMessages);

// Cursor-based pagination routes (must come before generic routes)
router.get('/cursor', messageController.getAllMessagesCursor);
router.get('/unread/cursor', messageController.getUnreadMessagesCursor);

// Generic routes (must come before parameterized routes)
router.get("/", messageController.getAllMessages);

// Routes with parameters
router.post("/:friendId", messageController.sendMessage);
router.get("/:friendId/cursor", messageController.getConversationCursor);
router.get("/:friendId", messageController.getConversation);
router.patch("/:messageId/status", messageController.updateStatus);
router.delete("/:messageId", messageController.deleteMessage);

export default router;