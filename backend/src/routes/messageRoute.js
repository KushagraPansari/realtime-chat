import express from 'express';
import { isLoggedIn } from '../middleware/authMiddleware.js';
import { getMessages, getUsersForSidebar, sendMessage, addReaction, removeReaction } from '../controllers/messageController.js';
import { validate } from "../middleware/validate.js";
import { sendMessageSchema, addReactionSchema } from "../validators/messageValidator.js";
import { messageLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();



router.get('/users',isLoggedIn,getUsersForSidebar);
router.get('/:id',isLoggedIn,getMessages);
router.post("/send/:id", isLoggedIn, messageLimiter, validate(sendMessageSchema), sendMessage);

router.post("/:id/reaction", isLoggedIn, validate(addReactionSchema), addReaction);
router.delete("/:id/reaction", isLoggedIn, validate(addReactionSchema), removeReaction);

export default router; 