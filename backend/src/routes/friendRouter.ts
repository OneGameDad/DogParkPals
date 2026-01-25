import express from "express";
import friendController from "../controllers/friendController";
import { requireAuth } from "../middlewares/authMiddleware";

const router = express.Router();

router.use(requireAuth);
router.post("/accept", friendController.acceptFriendRequest);
router.post("/decline", friendController.declineFriendRequest);
router.post("/", friendController.addFriend);
router.delete("/", friendController.removeFriend);
// GET /?userId=1 or GET /?dogId=1
router.get("/", friendController.getFriendsList);

export default router;