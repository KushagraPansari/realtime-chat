import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import { AuthenticationError } from '../utils/errors/AppError.js';
import { AUTH } from '../utils/constants.js';
import logger from '../utils/logger.js';


export const isLoggedIn = async (req, res, next) => {
  try {
    const token = req.cookies[AUTH.COOKIE_NAME];

    if (!token) {
      throw new AuthenticationError('No authentication token provided');
    }


    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        throw new AuthenticationError('Token has expired');
      }
      throw new AuthenticationError('Invalid token');
    }

    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    req.user = user;
    
    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      logger.debug('Authentication failed', { 
        message: error.message,
        path: req.path 
      });
    } else {
      logger.error('Authentication middleware error', {
        error: error.message,
        path: req.path
      });
    }
    next(error);
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies[AUTH.COOKIE_NAME];

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (user) {
      req.user = user;
    }

    next();
  } catch (error) {
    next();
  }
};

export default { isLoggedIn, optionalAuth };