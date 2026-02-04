import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';

import { requestIdMiddleware } from './middleware/requestId.js';
import { requestLogger } from './middleware/requestLogger.js';
import { performanceLogger } from './middleware/performanceLogger.js';
import { timeoutMiddleware } from './middleware/timeout.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';


import authRoutes from './routes/authRoute.js';
import messageRoutes from './routes/messageRoute.js';
import groupRoutes from './routes/groupRoute.js';
import healthRoutes from './routes/healthRoute.js';


export const createApp = (config = {}) => {
  const app = express();
  
  const {
    clientUrl = process.env.CLIENT_URL || 'http://localhost:5173',
    isProduction = process.env.NODE_ENV === 'production',
  } = config;

  //security
  app.use(helmet({
    contentSecurityPolicy: isProduction ? undefined : false,
    crossOriginEmbedderPolicy: false,
  }));
  

  app.use(cors({
    origin: clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  }));

  app.use(compression());
  
 
  app.use(timeoutMiddleware);

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
 
  app.use(cookieParser());

  app.use(requestIdMiddleware);

  if (process.env.NODE_ENV !== 'test') {
    app.use(requestLogger);
    app.use(performanceLogger);
  }

  app.use('/api/health', healthRoutes);
  
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/messages', messageRoutes);
  app.use('/api/v1/groups', groupRoutes);
  
  app.get('/favicon.ico', (req, res) => res.status(204).end());
  
  app.use(notFound);
  
  app.use(errorHandler);

  return app;
};

export default createApp;
