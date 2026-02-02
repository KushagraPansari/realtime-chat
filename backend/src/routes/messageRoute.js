import express from 'express';
import { isLoggedIn } from '../middleware/authMiddleware.js';
import { 
  getMessages, 
  getUsersForSidebar, 
  sendMessage, 
  addReaction, 
  removeReaction, 
  editMessage, 
  deleteMessage, 
  markAsRead, 
  sendGroupMessage,
  getGroupMessages 
} from '../controllers/messageController.js';
import { validate } from "../middleware/validate.js";
import { sendMessageSchema, addReactionSchema, editMessageSchema} from "../validators/messageValidator.js";
import { messageLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

const rateLimiter = process.env.NODE_ENV === 'test' 
  ? (req, res, next) => next() 
  : messageLimiter;

router.get('/users', isLoggedIn, getUsersForSidebar);
router.get('/:id', isLoggedIn, getMessages);
router.post("/send/:id", isLoggedIn, rateLimiter, validate(sendMessageSchema), sendMessage);

router.post("/group/:id", isLoggedIn, rateLimiter, validate(sendMessageSchema), sendGroupMessage);
router.get("/group/:id/messages", isLoggedIn, getGroupMessages);

router.post("/:id/reaction", isLoggedIn, validate(addReactionSchema), addReaction);
router.delete("/:id/reaction", isLoggedIn, validate(addReactionSchema), removeReaction);

router.put("/:id", isLoggedIn, validate(editMessageSchema), editMessage);
router.delete("/:id", isLoggedIn, deleteMessage);

router.post("/:id/read", isLoggedIn, markAsRead);

export default router;