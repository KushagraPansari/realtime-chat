import winston from 'winston';
import { getEnvConfig } from '../config/validateEnv.js';

const { nodeEnv, logLevel } = getEnvConfig();

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    if (stack) {
      return `${timestamp} [${level}]: ${message}\n${stack}`;
    }
    return `${timestamp} [${level}]: ${message}`;
  })
);

const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  defaultMeta: { service: 'realtime-chat-api' },
  transports: [
    new winston.transports.Console({
      format: nodeEnv === 'development' ? consoleFormat : logFormat,
    }),
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, 
      maxFiles: 5,
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, 
      maxFiles: 5,
    }),
  ],
  exitOnError: false,
});

import fs from 'fs';
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

export default logger;