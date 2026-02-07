import logger from '../utils/logger.js';
import { ENVIRONMENTS } from '../utils/constants.js';

export const handleMongooseError = (err) => {
  if (err.name === 'ValidationError' && err.errors) {
    const messages = Object.values(err.errors).map(e => e.message);
    return {
      message: 'Validation failed',
      statusCode: 400,
      isOperational: true,
      details: messages
    };
  }
  
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return {
      message: `${field} already exists`,
      statusCode: 409,
      isOperational: true
    };
  }
  
  if (err.name === 'CastError') {
    return {
      message: `Invalid ${err.path}: ${err.value}`,
      statusCode: 400,
      isOperational: true
    };
  }
  
  return null;
};

export const handleJWTError = (err) => {
  if (err.name === 'JsonWebTokenError') {
    return {
      message: 'Invalid token',
      statusCode: 401,
      isOperational: true
    };
  }
  
  if (err.name === 'TokenExpiredError') {
    return {
      message: 'Token expired',
      statusCode: 401,
      isOperational: true
    };
  }
  
  return null;
};

export const errorHandler = (err, req, res, next) => {
  const mongooseError = handleMongooseError(err);
  if (mongooseError) {
    err.message = mongooseError.message;
    err.statusCode = mongooseError.statusCode;
    err.isOperational = mongooseError.isOperational;
    err.details = mongooseError.details || null;
  }

  const jwtError = handleJWTError(err);
  if (jwtError) {
    err.message = jwtError.message;
    err.statusCode = jwtError.statusCode;
    err.isOperational = jwtError.isOperational;
  }

  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational || false;
  
  const errorLog = {
    requestId: req.id,
    message: err.message,
    statusCode,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userId: req.user?._id?.toString()
  };

  if (isOperational) {
    logger.warn('Operational error', errorLog);
  } else {
    logger.error('Programming error', {
      ...errorLog,
      stack: err.stack
    });
  }

  const response = {
    success: false,
    error: {
      message: err.message || 'Internal Server Error',
      ...(err.details && { details: err.details })
    },
    requestId: req.id,
    timestamp: new Date().toISOString()
  };

  if (process.env.NODE_ENV === ENVIRONMENTS.DEVELOPMENT) {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  error.isOperational = true;
  next(error);
};