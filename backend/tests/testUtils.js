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

  if (response.status !== 201) {
    throw new Error(
      `Failed to create user (${response.status}): ${JSON.stringify(response.body)}`
    );
  }

  if (!response.headers['set-cookie']) {
    throw new Error(
      `No cookie in response: ${JSON.stringify(response.headers)}`
    );
  }

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

  if (!response.headers['set-cookie']) {
    throw new Error(
      `Login failed (${response.status}): ${JSON.stringify(response.body)}`
    );
  }

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

  if (response.status !== 201) {
    throw new Error(
      `Failed to create group (${response.status}): ${JSON.stringify(response.body)}`
    );
  }

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

  if (response.status !== 201) {
    throw new Error(
      `Failed to send message (${response.status}): ${JSON.stringify(response.body)}`
    );
  }

  return response.body;
};