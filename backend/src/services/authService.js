import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import cloudinary from '../config/cloudinary.js';
import { 
  ValidationError, 
  AuthenticationError, 
  ConflictError, 
  NotFoundError 
} from '../utils/errors/AppError.js';
import { sanitizeEmail, sanitizeName, validateBase64Image } from '../utils/sanitize.js';
import { AUTH } from '../utils/constants.js';
import logger from '../utils/logger.js';


class AuthService {

  generateToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: AUTH.JWT_EXPIRES_IN }
    );
  }


  setAuthCookie(res, token) {
    const isProduction = process.env.NODE_ENV === 'production';
    
    res.cookie(AUTH.COOKIE_NAME, token, {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true,
      sameSite: 'strict',
      secure: isProduction
    });
  }


  clearAuthCookie(res) {
    res.cookie(AUTH.COOKIE_NAME, '', { maxAge: 0 });
  }

  async hashPassword(password) {
    const salt = await bcrypt.genSalt(AUTH.SALT_ROUNDS);
    return bcrypt.hash(password, salt);
  }


  async comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
  }


  async signup({ fullName, email, password }) {
    const sanitizedEmail = sanitizeEmail(email);
    const sanitizedName = sanitizeName(fullName);

    const existingUser = await User.findOne({ email: sanitizedEmail });
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    const hashedPassword = await this.hashPassword(password);

    const user = new User({
      fullName: sanitizedName,
      email: sanitizedEmail,
      password: hashedPassword
    });

    await user.save();

    logger.info('New user registered', { 
      userId: user._id,
      email: sanitizedEmail 
    });

    return {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
      createdAt: user.createdAt
    };
  }


  async login({ email, password }) {
    const sanitizedEmail = sanitizeEmail(email);

    const user = await User.findOne({ email: sanitizedEmail });
    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    const isPasswordValid = await this.comparePassword(password, user.password);
    if (!isPasswordValid) {
      logger.warn('Failed login attempt', { email: sanitizedEmail });
      throw new AuthenticationError('Invalid credentials');
    }

    logger.info('User logged in', { 
      userId: user._id,
      email: sanitizedEmail 
    });

    return {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic
    };
  }


  async updateProfile(userId, { fullName, profilePic }) {
    const updates = {};

    if (profilePic) {
      validateBase64Image(profilePic);
      
      try {
        const uploadResult = await cloudinary.uploader.upload(profilePic, {
          folder: 'chat-app/avatars',
          transformation: [
            { width: 200, height: 200, crop: 'fill' },
            { quality: 'auto' }
          ]
        });
        updates.profilePic = uploadResult.secure_url;
        
        logger.info('Profile picture uploaded', { userId });
      } catch (error) {
        logger.error('Cloudinary upload failed', { error: error.message, userId });
        throw new ValidationError('Failed to upload profile picture');
      }
    }

    if (fullName) {
      updates.fullName = sanitizeName(fullName);
    }

    if (Object.keys(updates).length === 0) {
      throw new ValidationError('No fields to update');
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, select: '-password' }
    );

    if (!updatedUser) {
      throw new NotFoundError('User');
    }

    logger.info('Profile updated', { userId, fields: Object.keys(updates) });

    return updatedUser;
  }


  async getUserById(userId) {
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      throw new NotFoundError('User');
    }

    return user;
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new AuthenticationError('Invalid or expired token');
    }
  }
}

export default new AuthService();
