import redis from '../config/redis.js';
import logger from './logger.js';

class Cache {

  async set(key, value, ttl = 3600) {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await redis.setex(key, ttl, serialized);
      } else {
        await redis.set(key, serialized);
      }
      logger.debug(`Cache set: ${key}`);
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
    }
  }

  async get(key) {
    try {
      const data = await redis.get(key);
      if (!data) return null;
      
      logger.debug(`Cache hit: ${key}`);
      return JSON.parse(data);
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async del(key) {
    try {
      await redis.del(key);
      logger.debug(`Cache deleted: ${key}`);
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
    }
  }

  async delPattern(pattern) {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        logger.debug(`Cache deleted ${keys.length} keys matching: ${pattern}`);
      }
    } catch (error) {
      logger.error(`Cache delete pattern error for ${pattern}:`, error);
    }
  }

  async exists(key) {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  async ttl(key) {
    try {
      return await redis.ttl(key);
    } catch (error) {
      logger.error(`Cache TTL error for key ${key}:`, error);
      return -2;
    }
  }
}

export default new Cache();