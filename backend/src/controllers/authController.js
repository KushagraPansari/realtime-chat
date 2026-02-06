import authService from '../services/authService.js';
import { successResponse, createdResponse } from '../utils/response.js';


export const signup = async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;
    
    const user = await authService.signup({ fullName, email, password });
    
    const token = authService.generateToken(user._id);
    authService.setAuthCookie(res, token);
    
    createdResponse(res, { user });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    const user = await authService.login({ email, password });
    
    const token = authService.generateToken(user._id);
    authService.setAuthCookie(res, token);
    
    successResponse(res, { user });
  } catch (error) {
    next(error);
  }
};

export const logout = (req, res, next) => {
  try {
    authService.clearAuthCookie(res);
    successResponse(res, { message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { profilePic, fullName } = req.body;
    const userId = req.user._id;
    
    const updatedUser = await authService.updateProfile(userId, { fullName, profilePic });
    
    successResponse(res, { user: updatedUser });
  } catch (error) {
    next(error);  
  }
};

export const checkAuth = (req, res, next) => {
  try {
    successResponse(res, { user: req.user });
  } catch (error) {
    next(error);
  }
};