import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redis from '../config/redis.js';
import logger from '../utils/logger.js';

export const apiLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:api:',
  }),
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later.'
    });
  }
});


export const authLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:auth:',
  }),
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.'
  },
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts, please try again in 15 minutes.'
    });
  }
});

export const messageLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:message:',
  }),
  windowMs: 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Too many messages sent, please slow down.'
  },
  handler: (req, res) => {
    logger.warn(`Message rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Sending messages too quickly, please wait a moment.'
    });
  }
});