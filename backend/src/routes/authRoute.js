import express from 'express';
import { checkAuth, login, logout, signup, updateProfile } from '../controllers/authController.js';
import { isLoggedIn } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/signup', authLimiter, signup);
router.post('/login', authLimiter, login);
router.post('/logout', logout);

router.put('/updateProfile', isLoggedIn, updateProfile);

router.get('/check', isLoggedIn, checkAuth);

export default router;