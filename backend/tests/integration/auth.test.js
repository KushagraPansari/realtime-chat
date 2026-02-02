import request from 'supertest';
import { app } from '../../src/config/socket.js';
import User from '../../src/models/userModel.js';

describe('Auth API Integration Tests', () => {
  describe('POST /api/auth/signup', () => {
    test('should create a new user in database', async () => {
      const userData = {
        email: 'test@example.com',
        fullName: 'Test User',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(201);

      expect(response.body._id).toBeDefined();
      expect(response.body.email).toBe(userData.email);
      expect(response.body.fullName).toBe(userData.fullName);
      expect(response.body.password).toBeUndefined();

      const userInDb = await User.findById(response.body._id);
      expect(userInDb).toBeDefined();
      expect(userInDb.email).toBe(userData.email);
      expect(userInDb.password).not.toBe(userData.password); // Should be hashed
    });

    test('should set authentication cookie', async () => {
      const userData = {
        email: 'test2@example.com',
        fullName: 'Test User 2',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData);

      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('jwt');
    });

    test('should fail with duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        fullName: 'Test User',
        password: 'password123'
      };

      await request(app)
        .post('/api/auth/signup')
        .send(userData);

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already');
    });

    test('should fail with invalid data', async () => {
      const invalidData = {
        email: 'notanemail',
        fullName: 'A',
        password: '123'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      
      const users = await User.find({});
      expect(users.length).toBe(0);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'logintest@example.com',
          fullName: 'Login Test',
          password: 'password123'
        });
    });

    test('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'logintest@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe('logintest@example.com');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    test('should fail with wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'logintest@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should fail with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/check', () => {
    test('should return user data when authenticated', async () => {
      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'authcheck@example.com',
          fullName: 'Auth Check',
          password: 'password123'
        });

      const cookie = signupResponse.headers['set-cookie'];

      const response = await request(app)
        .get('/api/auth/check')
        .set('Cookie', cookie)
        .expect(200);

      expect(response.body.email).toBe('authcheck@example.com');
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/auth/check')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    test('should clear authentication cookie', async () => {
      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'logout@example.com',
          fullName: 'Logout Test',
          password: 'password123'
        });

      const cookie = signupResponse.headers['set-cookie'];

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', cookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      
      const setCookieHeader = response.headers['set-cookie'];
      expect(setCookieHeader).toBeDefined();
    });
  });

  describe('PUT /api/auth/updateProfile', () => {
    test('should update user profile', async () => {
      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'update@example.com',
          fullName: 'Original Name',
          password: 'password123'
        });

      const cookie = signupResponse.headers['set-cookie'];
      const userId = signupResponse.body._id;

      const response = await request(app)
        .put('/api/auth/updateProfile')
        .set('Cookie', cookie)
        .send({
          fullName: 'Updated Name'
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      const updatedUser = await User.findById(userId);
      expect(updatedUser.fullName).toBe('Updated Name');
    });

    test('should fail without authentication', async () => {
      await request(app)
        .put('/api/auth/updateProfile')
        .send({ fullName: 'New Name' })
        .expect(401);
    });
  });
});