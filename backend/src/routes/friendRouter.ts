import express from "express";
import friendController from "../controllers/friendController";
import { requireAuth } from "../middlewares/authMiddleware";

const router = express.Router();

router.use(requireAuth);
router.post("/friends", friendController.addFriend);
router.post("/friends/accept", friendController.acceptFriendRequest);
router.post("/friends/decline", friendController.declineFriendRequest);
router.delete("/friends", friendController.removeFriend);
// GET /friends?userId=1 or GET /friends?dogId=1
router.get("/friends", friendController.getFriendsList);

export default router;