import request from 'supertest';
import { app } from '../../src/config/socket.js';
import Message from '../../src/models/messageModel.js';
import { createTestUsers } from '../testUtils.js';

describe('Message API Integration Tests', () => {
  let user1, user2;
  let cookie1, cookie2;

  beforeEach(async () => {
    const users = await createTestUsers(2);
    user1 = users[0].user;
    user2 = users[1].user;
    cookie1 = users[0].cookie;
    cookie2 = users[1].cookie;
  });

  describe('POST /api/v1/messages/send/:id', () => {
    test('should send a message between users', async () => {
      const messageData = {
        text: 'Hello from user 1 to user 2'
      };

      const response = await request(app)
        .post(`/api/v1/messages/send/${user2._id}`)
        .set('Cookie', cookie1)
        .send(messageData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message.text).toBe(messageData.text);
      expect(response.body.message.senderId).toBe(user1._id);
      expect(response.body.message.receiverId).toBe(user2._id);

      const messageInDb = await Message.findById(response.body.message._id);
      expect(messageInDb).toBeDefined();
      expect(messageInDb.text).toBe(messageData.text);
    });

    test('should fail with empty message', async () => {
      const response = await request(app)
        .post(`/api/v1/messages/send/${user2._id}`)
        .set('Cookie', cookie1)
        .send({ text: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should fail without authentication', async () => {
      await request(app)
        .post(`/api/v1/messages/send/${user2._id}`)
        .send({ text: 'Hello' })
        .expect(401);
    });
  });

  describe('GET /api/v1/messages/:id', () => {
    beforeEach(async () => {
      await request(app)
        .post(`/api/v1/messages/send/${user2._id}`)
        .set('Cookie', cookie1)
        .send({ text: 'Message 1 from user1' });

      await request(app)
        .post(`/api/v1/messages/send/${user1._id}`)
        .set('Cookie', cookie2)
        .send({ text: 'Message 2 from user2' });

      await request(app)
        .post(`/api/v1/messages/send/${user2._id}`)
        .set('Cookie', cookie1)
        .send({ text: 'Message 3 from user1' });
    });

    test('should retrieve conversation between two users', async () => {
      const response = await request(app)
        .get(`/api/v1/messages/${user2._id}`)
        .set('Cookie', cookie1)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.messages).toHaveLength(3);
      expect(response.body.messages[0].text).toBe('Message 1 from user1');
      expect(response.body.messages[1].text).toBe('Message 2 from user2');
      expect(response.body.messages[2].text).toBe('Message 3 from user1');
    });

    test('should support pagination', async () => {
      const response = await request(app)
        .get(`/api/v1/messages/${user2._id}?limit=2`)
        .set('Cookie', cookie1)
        .expect(200);

      expect(response.body.messages).toHaveLength(2);
      expect(response.body.pagination.hasMore).toBe(true);
      expect(response.body.pagination.nextCursor).toBeDefined();
    });

    test('should filter out deleted messages', async () => {
      const messages = await Message.find({});
      const firstMessage = messages[0];

      firstMessage.isDeleted = true;
      await firstMessage.save();

      const response = await request(app)
        .get(`/api/v1/messages/${user2._id}`)
        .set('Cookie', cookie1)
        .expect(200);

      expect(response.body.messages).toHaveLength(2);
    });
  });

  describe('GET /api/v1/messages/users', () => {
    test('should return list of users with last message', async () => {
      await request(app)
        .post(`/api/v1/messages/send/${user2._id}`)
        .set('Cookie', cookie1)
        .send({ text: 'Last message' });

      const response = await request(app)
        .get('/api/v1/messages/users')
        .set('Cookie', cookie1)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.chats).toBeDefined();
      expect(Array.isArray(response.body.chats)).toBe(true);
    });
  });

  describe('PUT /api/v1/messages/:id', () => {
    test('should edit own message', async () => {
      const sendResponse = await request(app)
        .post(`/api/v1/messages/send/${user2._id}`)
        .set('Cookie', cookie1)
        .send({ text: 'Original message' });

      const messageId = sendResponse.body.message._id;

      const response = await request(app)
        .put(`/api/v1/messages/${messageId}`)
        .set('Cookie', cookie1)
        .send({ text: 'Edited message' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.text).toBe('Edited message');
      expect(response.body.data.isEdited).toBe(true);

      const messageInDb = await Message.findById(messageId);
      expect(messageInDb.text).toBe('Edited message');
      expect(messageInDb.isEdited).toBe(true);
    });

    test('should fail to edit another user message', async () => {
      const sendResponse = await request(app)
        .post(`/api/v1/messages/send/${user2._id}`)
        .set('Cookie', cookie1)
        .send({ text: 'Message from user1' });

      const messageId = sendResponse.body.message._id;

      const response = await request(app)
        .put(`/api/v1/messages/${messageId}`)
        .set('Cookie', cookie2)
        .send({ text: 'Trying to edit' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/messages/:id', () => {
    test('should soft delete own message', async () => {
      const sendResponse = await request(app)
        .post(`/api/v1/messages/send/${user2._id}`)
        .set('Cookie', cookie1)
        .send({ text: 'Message to delete' });

      const messageId = sendResponse.body.message._id;

      const response = await request(app)
        .delete(`/api/v1/messages/${messageId}`)
        .set('Cookie', cookie1)
        .expect(200);

      expect(response.body.success).toBe(true);

      const messageInDb = await Message.findById(messageId);
      expect(messageInDb.isDeleted).toBe(true);
      expect(messageInDb.deletedAt).toBeDefined();
    });

    test('should fail to delete another user message', async () => {
      const sendResponse = await request(app)
        .post(`/api/v1/messages/send/${user2._id}`)
        .set('Cookie', cookie1)
        .send({ text: 'Message from user1' });

      const messageId = sendResponse.body.message._id;

      await request(app)
        .delete(`/api/v1/messages/${messageId}`)
        .set('Cookie', cookie2)
        .expect(403);
    });
  });

  describe('POST /api/v1/messages/:id/reaction', () => {
    test('should add reaction to message', async () => {
      const sendResponse = await request(app)
        .post(`/api/v1/messages/send/${user2._id}`)
        .set('Cookie', cookie1)
        .send({ text: 'React to this' });

      const messageId = sendResponse.body.message._id;

      const response = await request(app)
        .post(`/api/v1/messages/${messageId}/reaction`)
        .set('Cookie', cookie2)
        .send({ emoji: '👍' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.reactions).toHaveLength(1);
      expect(response.body.reactions[0].emoji).toBe('👍');

      const messageInDb = await Message.findById(messageId);
      expect(messageInDb.reactions).toHaveLength(1);
    });

    test('should fail to add duplicate reaction', async () => {
      const sendResponse = await request(app)
        .post(`/api/v1/messages/send/${user2._id}`)
        .set('Cookie', cookie1)
        .send({ text: 'React to this' });

      const messageId = sendResponse.body.message._id;

      await request(app)
        .post(`/api/v1/messages/${messageId}/reaction`)
        .set('Cookie', cookie2)
        .send({ emoji: '👍' });

      const response = await request(app)
        .post(`/api/v1/messages/${messageId}/reaction`)
        .set('Cookie', cookie2)
        .send({ emoji: '👍' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});