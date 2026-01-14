import logger from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  
  const isOperational = err.isOperational || false;
  
  if (isOperational) {
    logger.warn('Operational error:', {
      message: err.message,
      statusCode: statusCode,
      path: req.path,
      method: req.method
    });
  } else {
    logger.error('Programming error:', {
      message: err.message,
      statusCode: statusCode,
      stack: err.stack,
      path: req.path,
      method: req.method
    });
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};