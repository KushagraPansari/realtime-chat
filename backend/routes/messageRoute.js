import express from 'express';
import { isLoggedIn } from '../middleware/authMiddleware.js';
import { getMessages, getUsersForSidebar, sendMessage } from '../controllers/messageController.js';

const router = express.Router();



router.get('/users',isLoggedIn,getUsersForSidebar);
router.get('/:id',isLoggedIn,getMessages);

router.post('/send/:id',isLoggedIn,sendMessage)


export default router; 