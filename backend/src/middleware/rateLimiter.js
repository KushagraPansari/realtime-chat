import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';

let RedisStore;
let redis;
let useRedis = false;

try {
  const redisModule = await import('../config/redis.js');
  redis = redisModule.default;
  const rateLimitRedis = await import('rate-limit-redis');
  RedisStore = rateLimitRedis.RedisStore;
  
  await redis.ping();
  useRedis = true;
  logger.info('Rate limiting using Redis store');
} catch (error) {
  logger.warn('Redis not available, using in-memory rate limiting (not suitable for production)');
  useRedis = false;
}

const getStoreConfig = () => {
  if (useRedis) {
    return {
      store: new RedisStore({
        sendCommand: (...args) => redis.call(...args),
      })
    };
  }
  return {};
};


export const apiLimiter = rateLimit({
  ...getStoreConfig(),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
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
  ...getStoreConfig(),
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
  ...getStoreConfig(),
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