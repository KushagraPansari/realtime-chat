import express from "express";
import {
  createGroup,
  getUserGroups,
  getGroupDetails,
  addMembers,
  removeMember,
  leaveGroup,
  deleteGroup,
  promoteMember,
  updateGroup
} from "../controllers/groupController.js";
import { isLoggedIn } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { createGroupSchema, addMembersSchema } from "../validators/messageValidator.js";

const router = express.Router();

router.use(isLoggedIn);

router.post("/", validate(createGroupSchema), createGroup);
router.get("/", getUserGroups);
router.get("/:id", getGroupDetails);
router.put("/:id", updateGroup);

router.post("/:id/members", validate(addMembersSchema), addMembers);
router.delete("/:id/members/:memberId", removeMember);
router.put("/:id/members/:memberId/promote", promoteMember);
router.post("/:id/leave", leaveGroup);
router.delete("/:id", deleteGroup);

export default router;