import authService from '../services/authService.js';
import { successResponse, createdResponse } from '../utils/response.js';
import { asyncHandler } from '../middleware/asyncHandler.js';


export const signup = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;
  
  const user = await authService.signup({ fullName, email, password });
  
  const token = authService.generateToken(user._id);
  authService.setAuthCookie(res, token);
  
  createdResponse(res, { user });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  const user = await authService.login({ email, password });
  
  const token = authService.generateToken(user._id);
  authService.setAuthCookie(res, token);
  
  successResponse(res, { user });
});

export const logout = (req, res) => {
  authService.clearAuthCookie(res);
  successResponse(res, { message: 'Logged out successfully' });
};

export const updateProfile = asyncHandler(async (req, res) => {
  const { profilePic, fullName } = req.body;
  const userId = req.user._id;
  
  const updatedUser = await authService.updateProfile(userId, { fullName, profilePic });
  
  successResponse(res, { user: updatedUser });
});

export const checkAuth = (req, res) => {
  successResponse(res, { user: req.user });
};