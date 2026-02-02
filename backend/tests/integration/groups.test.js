import request from 'supertest';
import { app } from '../../src/config/socket.js';
import Group from '../../src/models/groupModel.js';
import Message from '../../src/models/messageModel.js';
import { createTestUsers } from '../testUtils.js';

describe('Group API Integration Tests', () => {
  let user1, user2, user3;
  let cookie1, cookie2, cookie3;

  beforeEach(async () => {
    const users = await createTestUsers(3);
    user1 = users[0].user;
    user2 = users[1].user;
    user3 = users[2].user;
    cookie1 = users[0].cookie;
    cookie2 = users[1].cookie;
    cookie3 = users[2].cookie;
  });

  describe('POST /api/groups', () => {
    test('should create a new group', async () => {
      const groupData = {
        name: 'Test Group',
        description: 'A test group',
        memberIds: [user2._id, user3._id]
      };

      const response = await request(app)
        .post('/api/groups')
        .set('Cookie', cookie1)
        .send(groupData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.group.name).toBe(groupData.name);
      expect(response.body.group.members).toHaveLength(3);
      
      const creator = response.body.group.members.find(
        m => m.userId._id === user1._id
      );
      expect(creator.role).toBe('admin');

      const groupInDb = await Group.findById(response.body.group._id);
      expect(groupInDb).toBeDefined();
      expect(groupInDb.name).toBe(groupData.name);
      expect(groupInDb.createdBy.toString()).toBe(user1._id);
    });

    test('should create group with only creator', async () => {
      const groupData = {
        name: 'Solo Group',
        description: 'Just me',
        memberIds: []
      };

      const response = await request(app)
        .post('/api/groups')
        .set('Cookie', cookie1)
        .send(groupData)
        .expect(201);

      expect(response.body.group.members).toHaveLength(1);
      expect(response.body.group.members[0].userId._id).toBe(user1._id);
      expect(response.body.group.members[0].role).toBe('admin');
    });

    test('should fail with invalid name', async () => {
      const groupData = {
        name: '',
        description: 'Invalid group'
      };

      const response = await request(app)
        .post('/api/groups')
        .set('Cookie', cookie1)
        .send(groupData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should fail without authentication', async () => {
      await request(app)
        .post('/api/groups')
        .send({ name: 'Test' })
        .expect(401);
    });

    test('should handle duplicate member IDs', async () => {
      const groupData = {
        name: 'Duplicate Test',
        memberIds: [user2._id, user2._id, user3._id]
      };

      const response = await request(app)
        .post('/api/groups')
        .set('Cookie', cookie1)
        .send(groupData)
        .expect(201);

      expect(response.body.group.members).toHaveLength(3);
    });
  });

  describe('GET /api/groups', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/groups')
        .set('Cookie', cookie1)
        .send({
          name: 'Group 1',
          description: 'First group',
          memberIds: [user2._id]
        });

      await request(app)
        .post('/api/groups')
        .set('Cookie', cookie2)
        .send({
          name: 'Group 2',
          description: 'Second group',
          memberIds: [user1._id]
        });
    });

    test('should return all groups user is member of', async () => {
      const response = await request(app)
        .get('/api/groups')
        .set('Cookie', cookie1)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.groups).toHaveLength(2);
      expect(response.body.groups[0].name).toBeDefined();
    });

    test('should return empty array if user has no groups', async () => {
      const response = await request(app)
        .get('/api/groups')
        .set('Cookie', cookie3)
        .expect(200);

      expect(response.body.groups).toHaveLength(0);
    });

    test('should fail without authentication', async () => {
      await request(app)
        .get('/api/groups')
        .expect(401);
    });
  });

  describe('GET /api/groups/:id', () => {
    let groupId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/groups')
        .set('Cookie', cookie1)
        .send({
          name: 'Test Group',
          description: 'Test',
          memberIds: [user2._id]
        });
      
      groupId = response.body.group._id;
    });

    test('should return group details for members', async () => {
      const response = await request(app)
        .get(`/api/groups/${groupId}`)
        .set('Cookie', cookie1)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.group._id).toBe(groupId);
      expect(response.body.group.members).toBeDefined();
    });

    test('should fail for non-members', async () => {
      const response = await request(app)
        .get(`/api/groups/${groupId}`)
        .set('Cookie', cookie3)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    test('should fail for non-existent group', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      await request(app)
        .get(`/api/groups/${fakeId}`)
        .set('Cookie', cookie1)
        .expect(404);
    });
  });

  describe('POST /api/groups/:id/members', () => {
    let groupId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/groups')
        .set('Cookie', cookie1)
        .send({
          name: 'Test Group',
          memberIds: []
        });
      
      groupId = response.body.group._id;
    });

    test('should add members as admin', async () => {
      const response = await request(app)
        .post(`/api/groups/${groupId}/members`)
        .set('Cookie', cookie1)
        .send({ memberIds: [user2._id, user3._id] })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.group.members).toHaveLength(3);

      const groupInDb = await Group.findById(groupId);
      expect(groupInDb.members).toHaveLength(3);
    });

    test('should fail as non-admin', async () => {
      await request(app)
        .post(`/api/groups/${groupId}/members`)
        .set('Cookie', cookie1)
        .send({ memberIds: [user2._id] });

      const response = await request(app)
        .post(`/api/groups/${groupId}/members`)
        .set('Cookie', cookie2)
        .send({ memberIds: [user3._id] })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    test('should skip already existing members', async () => {
      await request(app)
        .post(`/api/groups/${groupId}/members`)
        .set('Cookie', cookie1)
        .send({ memberIds: [user2._id] });

      const response = await request(app)
        .post(`/api/groups/${groupId}/members`)
        .set('Cookie', cookie1)
        .send({ memberIds: [user2._id, user3._id] })
        .expect(200);

      expect(response.body.group.members).toHaveLength(3);
    });
  });

  describe('DELETE /api/groups/:id/members/:memberId', () => {
    let groupId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/groups')
        .set('Cookie', cookie1)
        .send({
          name: 'Test Group',
          memberIds: [user2._id, user3._id]
        });
      
      groupId = response.body.group._id;
    });

    test('should remove member as admin', async () => {
      const response = await request(app)
        .delete(`/api/groups/${groupId}/members/${user2._id}`)
        .set('Cookie', cookie1)
        .expect(200);

      expect(response.body.success).toBe(true);

      const groupInDb = await Group.findById(groupId);
      expect(groupInDb.members).toHaveLength(2);
      
      const user2Exists = groupInDb.members.some(
        m => m.userId.toString() === user2._id
      );
      expect(user2Exists).toBe(false);
    });

    test('should fail to remove group creator', async () => {
      const response = await request(app)
        .delete(`/api/groups/${groupId}/members/${user1._id}`)
        .set('Cookie', cookie1)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('creator');
    });

    test('should fail as non-admin', async () => {
      const response = await request(app)
        .delete(`/api/groups/${groupId}/members/${user3._id}`)
        .set('Cookie', cookie2)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/groups/:id/leave', () => {
    let groupId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/groups')
        .set('Cookie', cookie1)
        .send({
          name: 'Test Group',
          memberIds: [user2._id]
        });
      
      groupId = response.body.group._id;
    });

    test('should allow member to leave group', async () => {
      const response = await request(app)
        .post(`/api/groups/${groupId}/leave`)
        .set('Cookie', cookie2)
        .expect(200);

      expect(response.body.success).toBe(true);

      const groupInDb = await Group.findById(groupId);
      expect(groupInDb.members).toHaveLength(1);
    });

    test('should fail if creator tries to leave', async () => {
      const response = await request(app)
        .post(`/api/groups/${groupId}/leave`)
        .set('Cookie', cookie1)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('creator');
    });
  });

  describe('DELETE /api/groups/:id', () => {
    let groupId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/groups')
        .set('Cookie', cookie1)
        .send({
          name: 'Test Group',
          memberIds: [user2._id]
        });
      
      groupId = response.body.group._id;
    });

    test('should delete group as creator', async () => {
      const response = await request(app)
        .delete(`/api/groups/${groupId}`)
        .set('Cookie', cookie1)
        .expect(200);

      expect(response.body.success).toBe(true);

      const groupInDb = await Group.findById(groupId);
      expect(groupInDb).toBeNull();
    });

    test('should soft delete group messages', async () => {
      await request(app)
        .post(`/api/messages/group/${groupId}`)
        .set('Cookie', cookie1)
        .send({ text: 'Group message' });

      await request(app)
        .delete(`/api/groups/${groupId}`)
        .set('Cookie', cookie1);

      const messages = await Message.find({ groupId });
      expect(messages).toHaveLength(1);
      expect(messages[0].isDeleted).toBe(true);
    });

    test('should fail if non-creator tries to delete', async () => {
      const response = await request(app)
        .delete(`/api/groups/${groupId}`)
        .set('Cookie', cookie2)
        .expect(403);

      expect(response.body.success).toBe(false);

      const groupInDb = await Group.findById(groupId);
      expect(groupInDb).toBeDefined();
    });
  });

  describe('POST /api/messages/group/:id', () => {
    let groupId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/groups')
        .set('Cookie', cookie1)
        .send({
          name: 'Test Group',
          memberIds: [user2._id]
        });
      
      groupId = response.body.group._id;
    });

    test('should send message to group', async () => {
      const response = await request(app)
        .post(`/api/messages/group/${groupId}`)
        .set('Cookie', cookie1)
        .send({ text: 'Hello group!' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message.text).toBe('Hello group!');
      expect(response.body.message.groupId).toBe(groupId);
      expect(response.body.message.senderId._id).toBe(user1._id);

      const messageInDb = await Message.findById(response.body.message._id);
      expect(messageInDb.groupId.toString()).toBe(groupId);
    });

    test('should fail for non-members', async () => {
      const response = await request(app)
        .post(`/api/messages/group/${groupId}`)
        .set('Cookie', cookie3)
        .send({ text: 'Hello' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    test('should fail with empty message', async () => {
      await request(app)
        .post(`/api/messages/group/${groupId}`)
        .set('Cookie', cookie1)
        .send({ text: '' })
        .expect(400);
    });
  });

  describe('GET /api/messages/group/:id/messages', () => {
    let groupId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/groups')
        .set('Cookie', cookie1)
        .send({
          name: 'Test Group',
          memberIds: [user2._id]
        });
      
      groupId = response.body.group._id;

      await request(app)
        .post(`/api/messages/group/${groupId}`)
        .set('Cookie', cookie1)
        .send({ text: 'Message 1' });

      await request(app)
        .post(`/api/messages/group/${groupId}`)
        .set('Cookie', cookie2)
        .send({ text: 'Message 2' });

      await request(app)
        .post(`/api/messages/group/${groupId}`)
        .set('Cookie', cookie1)
        .send({ text: 'Message 3' });
    });

    test('should retrieve group messages', async () => {
      const response = await request(app)
        .get(`/api/messages/group/${groupId}/messages`)
        .set('Cookie', cookie1)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.messages).toHaveLength(3);
      expect(response.body.messages[0].text).toBe('Message 1');
    });

    test('should support pagination', async () => {
      const response = await request(app)
        .get(`/api/messages/group/${groupId}/messages?limit=2`)
        .set('Cookie', cookie1)
        .expect(200);

      expect(response.body.messages).toHaveLength(2);
      expect(response.body.pagination.hasMore).toBe(true);
    });

    test('should fail for non-members', async () => {
      await request(app)
        .get(`/api/messages/group/${groupId}/messages`)
        .set('Cookie', cookie3)
        .expect(403);
    });
  });
});