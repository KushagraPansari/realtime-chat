import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import logger from '../utils/logger.js';

const parseCookies = (cookieHeader) => {
  const cookies = {};
  
  if (!cookieHeader) {
    return cookies;
  }
  
  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.trim().split('=');
    if (name && rest.length > 0) {
      cookies[name] = rest.join('=');
    }
  });
  
  return cookies;
};

export const socketAuthMiddleware = async (socket, next) => {
  try {
    const cookies = parseCookies(socket.handshake.headers.cookie);
    const token = cookies.jwt_T;
    
    if (!token) {
      logger.warn('Socket connection rejected: No token provided', {
        ip: socket.handshake.address
      });
      return next(new Error('Authentication required'));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      logger.warn('Socket connection rejected: Invalid token', {
        ip: socket.handshake.address,
        error: jwtError.message
      });
      return next(new Error('Invalid or expired token'));
    }

    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      logger.warn('Socket connection rejected: User not found', {
        ip: socket.handshake.address,
        userId: decoded.userId
      });
      return next(new Error('User not found'));
    }

    socket.userId = user._id.toString();
    socket.user = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic
    };

    logger.debug('Socket authenticated', {
      userId: socket.userId,
      socketId: socket.id
    });

    next();
  } catch (error) {
    logger.error('Socket authentication error', {
      error: error.message,
      ip: socket.handshake.address
    });
    next(new Error('Authentication failed'));
  }
};

export default socketAuthMiddleware;
