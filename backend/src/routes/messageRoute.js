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
import { validateObjectId } from "../middleware/validateObjectId.js";

const router = express.Router();

const rateLimiter = process.env.NODE_ENV === 'test' 
  ? (req, res, next) => next() 
  : messageLimiter;

router.get('/users', isLoggedIn, getUsersForSidebar);
router.get('/:id', isLoggedIn, validateObjectId('id'), getMessages);
router.post("/send/:id", isLoggedIn, rateLimiter, validateObjectId('id'), validate(sendMessageSchema), sendMessage);

router.post("/group/:id", isLoggedIn, rateLimiter, validateObjectId('id'), validate(sendMessageSchema), sendGroupMessage);
router.get("/group/:id/messages", isLoggedIn, validateObjectId('id'), getGroupMessages);

router.post("/:id/reaction", isLoggedIn, validateObjectId('id'), validate(addReactionSchema), addReaction);
router.delete("/:id/reaction", isLoggedIn, validateObjectId('id'), validate(addReactionSchema), removeReaction);

router.put("/:id", isLoggedIn, validateObjectId('id'), validate(editMessageSchema), editMessage);
router.delete("/:id", isLoggedIn, validateObjectId('id'), deleteMessage);

router.post("/:id/read", isLoggedIn, validateObjectId('id'), markAsRead);

export default router;