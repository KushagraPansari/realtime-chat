import { HTTP_STATUS } from '../constants.js';

export class AppError extends Error {
  constructor(message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      message: this.message,
      statusCode: this.statusCode,
      ...(this.details && { details: this.details }),
      timestamp: this.timestamp
    };
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = null) {
    super(message, HTTP_STATUS.BAD_REQUEST, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, HTTP_STATUS.UNAUTHORIZED);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, HTTP_STATUS.FORBIDDEN);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, HTTP_STATUS.NOT_FOUND);
    this.name = 'NotFoundError';
    this.resource = resource;
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, HTTP_STATUS.CONFLICT);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests, please try again later') {
    super(message, HTTP_STATUS.TOO_MANY_REQUESTS);
    this.name = 'RateLimitError';
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(service = 'Service') {
    super(`${service} is temporarily unavailable`, HTTP_STATUS.SERVICE_UNAVAILABLE);
    this.name = 'ServiceUnavailableError';
    this.service = service;
  }
}