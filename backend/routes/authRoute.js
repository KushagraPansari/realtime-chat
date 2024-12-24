import express from 'express';
import { checkAuth, login, logout, signup, updateProfile } from '../controllers/authController.js';
import { isLoggedIn } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);

router.put('/updateProfile',isLoggedIn,updateProfile);

router.get('/check',isLoggedIn,checkAuth)

export default router;

//why is my app not working?
// 1. Make sure you have installed all the dependencies
