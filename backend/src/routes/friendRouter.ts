import express from "express";
import friendController from "../controllers/friendController";
// TODO: Import authentication middleware when implemented
// import { authenticate } from "../middleware/authenticate";

const router = express.Router();

// All routes require authentication (add authenticate middleware when available)
// TODO: Add authenticate middleware to all routes: router.use(authenticate)
router.post("/friends", friendController.addFriend);
router.post("/friends/accept", friendController.acceptFriendRequest);
router.post("/friends/decline", friendController.declineFriendRequest);
router.delete("/friends", friendController.removeFriend);
// GET /friends?userId=1 or GET /friends?dogId=1
router.get("/friends", friendController.getFriendsList);

export default router;