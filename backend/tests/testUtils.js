import request from 'supertest';
import { app } from '../src/config/socket.js';

export const createTestUser = async (userData = {}) => {
  const defaultUser = {
    email: 'test@example.com',
    fullName: 'Test User',
    password: 'password123',
    ...userData
  };

  const response = await request(app)
    .post('/api/auth/signup')
    .send(defaultUser);

  return {
    user: response.body,
    cookie: response.headers['set-cookie']
  };
};

export const createTestUsers = async (count) => {
  const users = [];
  
  for (let i = 0; i < count; i++) {
    const user = await createTestUser({
      email: `user${i}@example.com`,
      fullName: `User ${i}`,
      password: 'password123'
    });
    users.push(user);
  }
  
  return users;
};

export const loginUser = async (email, password) => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  return response.headers['set-cookie'];
};

export const createTestGroup = async (cookie, groupData = {}) => {
  const defaultGroup = {
    name: 'Test Group',
    description: 'A test group',
    memberIds: [],
    ...groupData
  };

  const response = await request(app)
    .post('/api/groups')
    .set('Cookie', cookie)
    .send(defaultGroup);

  return response.body.group;
};
export const sendTestMessage = async (cookie, receiverId, messageData = {}) => {
  const defaultMessage = {
    text: 'Test message',
    ...messageData
  };

  const response = await request(app)
    .post(`/api/messages/send/${receiverId}`)
    .set('Cookie', cookie)
    .send(defaultMessage);

  return response.body;
};