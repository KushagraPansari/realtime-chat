import mongoose from 'mongoose';

describe('Test Setup', () => {
  test('should connect to in-memory database', () => {
    expect(mongoose.connection.readyState).toBe(1); // 1 = connected
  });

  test('should have test environment variables', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.JWT_SECRET).toBe('test-jwt-secret-key-for-testing');
  });
});