import express from "express";
import organizationController from "../controllers/organizationController";
import { requireAuth } from "../middlewares/authMiddleware";

const router = express.Router();

router.use(requireAuth);
router.get("/name/:name", organizationController.getOrganizationByName);
router.get("/:id/details", organizationController.getOrganizationWithDetails);
router.post("/:id/join", organizationController.joinOrganization);
router.post("/:id/members", organizationController.addMember);
router.delete("/:id/members/:memberId", organizationController.removeMember);
router.put("/:id/members/:memberId", organizationController.updateMemberRole);
router.get("/:id/members/:memberId", organizationController.getMember);
router.get("/:id/members", organizationController.getMembers);
router.get("/:id/members/:userId/is-member", organizationController.isMember);
router.get("/:id", organizationController.getOrganizationById);
router.put("/:id", organizationController.updateOrganization);
router.delete("/:id", organizationController.deleteOrganization);
router.post("/", organizationController.createOrganization);
router.get("/", organizationController.getOrganizations);

export default router;