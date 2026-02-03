import dotenv from 'dotenv';
import path from 'path';
import express from 'express';

dotenv.config();

import { validateEnv, getEnvConfig } from './config/validateEnv.js';
import { connectDB } from './config/db.js';
import { app, server } from './config/socket.js';

import logger from './utils/logger.js';

try {
  validateEnv();
} catch (error) {
  console.error('Environment validation failed:', error.message);
  process.exit(1);
}

const config = getEnvConfig();

const __dirname = path.resolve();
if (config.nodeEnv === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'dist', 'index.html'));
  });
}

server.listen(config.port, () => {
  logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
  connectDB();
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});