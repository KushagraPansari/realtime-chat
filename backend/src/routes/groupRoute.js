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
import { validateObjectId } from "../middleware/validateObjectId.js";

const router = express.Router();

router.use(isLoggedIn);

router.post("/", validate(createGroupSchema), createGroup);
router.get("/", getUserGroups);
router.get("/:id", validateObjectId('id'), getGroupDetails);
router.put("/:id", validateObjectId('id'), updateGroup);

router.post("/:id/members", validateObjectId('id'), validate(addMembersSchema), addMembers);
router.delete("/:id/members/:memberId", validateObjectId('id', 'memberId'), removeMember);
router.put("/:id/members/:memberId/promote", validateObjectId('id', 'memberId'), promoteMember);
router.post("/:id/leave", validateObjectId('id'), leaveGroup);
router.delete("/:id", validateObjectId('id'), deleteGroup);

export default router;