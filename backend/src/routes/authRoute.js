import express from 'express';
import { checkAuth, login, logout, signup, updateProfile } from '../controllers/authController.js';
import { isLoggedIn } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { signupSchema, loginSchema, updateProfileSchema } from '../validators/authValidator.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/signup', authLimiter, validate(signupSchema), signup);
router.post('/login', authLimiter,validate(loginSchema), login);
router.post('/logout', logout);

router.put('/updateProfile', isLoggedIn, updateProfile);

router.get('/check', isLoggedIn, checkAuth);

export default router;