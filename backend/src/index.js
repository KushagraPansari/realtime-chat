import dotenv from 'dotenv';
import path from 'path';
import http from 'http';
import express from 'express';

dotenv.config();

import { validateEnv, getEnvConfig } from './config/validateEnv.js';
import { connectDB } from './config/db.js';
import { createApp } from './app.js';
import { initializeSocket, getIO } from './socket/index.js';
import logger from './utils/logger.js';

try {
  validateEnv();
} catch (error) {
  console.error('Environment validation failed:', error.message);
  process.exit(1);
}

const config = getEnvConfig();


const startServer = async () => {
  try {
    await connectDB();
    logger.info('Database connected');

    const app = createApp({
      clientUrl: config.clientUrl || process.env.CLIENT_URL,
      isProduction: config.nodeEnv === 'production',
    });

    const server = http.createServer(app);

    let redis = null;
    try {
      const redisModule = await import('./config/redis.js');
      redis = redisModule.default;
      await redis.ping();
      logger.info(' Redis connected');
    } catch (error) {
      logger.warn('Redis not available, using in-memory fallback');
    }

    await initializeSocket(server, {
      clientUrl: config.clientUrl || process.env.CLIENT_URL,
      redis,
    });
    logger.info('Socket.io initialized');

    if (config.nodeEnv === 'production') {
      const __dirname = path.resolve();
      app.use(express.static(path.join(__dirname, '../frontend/dist')));

      app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend', 'dist', 'index.html'));
      });
    }

    server.listen(config.port, () => {
      logger.info(`

    Server running on port ${config.port}                 
    Environment: ${config.nodeEnv.padEnd(37)}
    URL: http://localhost:${config.port}                  

      `);
    });

    setupGracefulShutdown(server, redis);

    return server;
  } catch (error) {
    logger.error('Failed to start server', { error: error.message, stack: error.stack });
    process.exit(1);
  }
};


const setupGracefulShutdown = (server, redis) => {
  const shutdown = async (signal) => {
    logger.info(`${signal} received, starting graceful shutdown...`);

    server.close(async () => {
      logger.info(' HTTP server closed');

      try {
        const io = getIO();
        if (io) {
          await new Promise((resolve) => {
            io.close(() => {
              logger.info('✓ Socket.io closed');
              resolve();
            });
          });
        }

        if (redis) {
          await redis.quit();
          logger.info('Redis connection closed');
        }

        const mongoose = await import('mongoose');
        await mongoose.default.connection.close();
        logger.info('MongoDB connection closed');

        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown', { error: error.message });
        process.exit(1);
      }
    });

    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection', {
      reason: reason?.message || reason,
      stack: reason?.stack
    });
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  });
};

startServer();
