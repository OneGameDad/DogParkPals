import express from "express";
import organizationController from "../controllers/organizationController";
// TODO: Import authentication middleware when implemented
// import { authenticate } from "../middleware/authenticate";

const router = express.Router();

// All routes require authentication (add authenticate middleware when available)
// TODO: Add authenticate middleware to all routes: router.use(authenticate)
router.post("/organizations", organizationController.createOrganization);
router.get("/organizations/name/:name", organizationController.getOrganizationByName);
router.get("/organizations/:id", organizationController.getOrganizationById);
router.get("/organizations", organizationController.getOrganizations);
router.put("/organizations/:id", organizationController.updateOrganization);
router.delete("/organizations/:id", organizationController.deleteOrganization);
router.post("/organizations/:id/members", organizationController.addMember);
router.delete("/organizations/:id/members/:memberId", organizationController.removeMember);
router.put("/organizations/:id/members/:memberId", organizationController.updateMemberRole);
router.get("/organizations/:id/members/:memberId", organizationController.getMember);
router.get("/organizations/:id/members", organizationController.getMembers);
router.get("/organizations/:id/members/:userId/is-member", organizationController.isMember);

export default router;