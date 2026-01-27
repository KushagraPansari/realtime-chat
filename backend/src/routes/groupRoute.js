import express from "express";
import {
  createGroup,
  getUserGroups,
  getGroupDetails,
  addMembers,
  removeMember,
  leaveGroup,
  deleteGroup
} from "../controllers/groupController.js";
import { isLoggedIn } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { createGroupSchema, addMembersSchema } from "../validators/messageValidator.js";

const router = express.Router();

router.post("/", isLoggedIn, validate(createGroupSchema), createGroup);
router.get("/", isLoggedIn, getUserGroups);
router.get("/:id", isLoggedIn, getGroupDetails);
router.post("/:id/members", isLoggedIn, validate(addMembersSchema), addMembers);
router.delete("/:id/members/:memberId", isLoggedIn, removeMember);
router.post("/:id/leave", isLoggedIn, leaveGroup);
router.delete("/:id", isLoggedIn, deleteGroup);

export default router;