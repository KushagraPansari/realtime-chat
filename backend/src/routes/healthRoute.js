import express from 'express';
import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

router.get('/detailed', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    services: {
      mongodb: { status: 'unknown' },
      redis: { status: 'unknown' }
    },
    memory: {
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    }
  };

  try {
    const mongoState = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    health.services.mongodb.status = states[mongoState] || 'unknown';
    
    if (mongoState === 1) {
      await mongoose.connection.db.admin().ping();
      health.services.mongodb.latency = 'ok';
    } else {
      health.status = 'degraded';
    }
  } catch (error) {
    health.services.mongodb.status = 'error';
    health.services.mongodb.error = error.message;
    health.status = 'degraded';
    logger.error('Health check MongoDB error', { error: error.message });
  }

  try {
    const redis = (await import('../config/redis.js')).default;
    const startTime = Date.now();
    await redis.ping();
    const latency = Date.now() - startTime;
    
    health.services.redis.status = 'connected';
    health.services.redis.latency = `${latency}ms`;
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.message.includes('not available')) {
      health.services.redis.status = 'not configured';
    } else {
      health.services.redis.status = 'error';
      health.services.redis.error = error.message;
    }
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

router.get('/ready', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        ready: false,
        reason: 'Database not connected'
      });
    }
    
    res.status(200).json({ ready: true });
  } catch (error) {
    res.status(503).json({
      ready: false,
      reason: error.message
    });
  }
});

router.get('/live', (req, res) => {
  res.status(200).json({ alive: true });
});

export default router;