import { 
  AppError, 
  ValidationError, 
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError
} from '../../src/utils/errors/AppError.js';

describe('Custom Error Classes', () => {
  describe('AppError', () => {
    test('should create error with correct properties', () => {
      const error = new AppError('Test error', 400);
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
      expect(error.stack).toBeDefined();
    });

    test('should default to status 500', () => {
      const error = new AppError('Server error');
      expect(error.statusCode).toBe(500);
    });
  });

  describe('ValidationError', () => {
    test('should have 400 status code', () => {
      const error = new ValidationError('Validation failed');
      
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Validation failed');
      expect(error.isOperational).toBe(true);
    });
  });

  describe('AuthenticationError', () => {
    test('should have 401 status code', () => {
      const error = new AuthenticationError('Not authenticated');
      
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Not authenticated');
      expect(error.isOperational).toBe(true);
    });
  });

  describe('AuthorizationError', () => {
    test('should have 403 status code', () => {
      const error = new AuthorizationError('Not authorized');
      
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Not authorized');
      expect(error.isOperational).toBe(true);
    });
  });

  describe('NotFoundError', () => {
    test('should have 404 status code', () => {
      const error = new NotFoundError('Resource');
      
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Resource not found');
      expect(error.isOperational).toBe(true);
    });
  });

  describe('ConflictError', () => {
    test('should have 409 status code', () => {
      const error = new ConflictError('Resource already exists');
      
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Resource already exists');
      expect(error.isOperational).toBe(true);
    });
  });

  describe('Error inheritance', () => {
    test('all custom errors should inherit from AppError', () => {
      const validationError = new ValidationError('test');
      const authError = new AuthenticationError('test');
      const notFoundError = new NotFoundError('test');
      
      expect(validationError).toBeInstanceOf(AppError);
      expect(authError).toBeInstanceOf(AppError);
      expect(notFoundError).toBeInstanceOf(AppError);
    });

    test('all custom errors should inherit from Error', () => {
      const validationError = new ValidationError('test');
      const authError = new AuthenticationError('test');
      
      expect(validationError).toBeInstanceOf(Error);
      expect(authError).toBeInstanceOf(Error);
    });
  });
});