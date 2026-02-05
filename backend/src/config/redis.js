import Redis from 'ioredis';
import logger from '../utils/logger.js';

const createRedisClient = () => {
  if (process.env.REDIS_URL) {
    return new Redis(process.env.REDIS_URL, {
      retryStrategy: (times) => {
        if (times > 3) return null;
        const delay = Math.min(times * 100, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
  }

  const host = process.env.REDIS_HOST || 'localhost';
  const port = parseInt(process.env.REDIS_PORT) || 6379;
  const password = process.env.REDIS_PASSWORD || undefined;

  return new Redis({
    host,
    port,
    password,
    retryStrategy: (times) => {
      if (times > 3) return null;
      const delay = Math.min(times * 100, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });
};

const redis = createRedisClient();

redis.on('connect', () => {
  logger.info('Redis client connected');
});

redis.on('error', (err) => {
   if (!redis._errorLogged) {
    logger.warn('Redis not available:', err.message);
    redis._errorLogged = true;
  }
});

redis.on('ready', () => {
  logger.info('Redis client ready');
});

redis.on('reconnecting', () => {
  logger.warn('Redis client reconnecting');
});


export default redis;