import { 
  signupSchema, 
  loginSchema,
  updateProfileSchema 
} from '../../src/validators/authValidator.js';
import { 
  sendMessageSchema,
  editMessageSchema,
  addReactionSchema,
  createGroupSchema,
  addMembersSchema
} from '../../src/validators/messageValidator.js';

describe('Auth Validation Schemas', () => {
  describe('signupSchema', () => {
    test('should validate correct signup data', () => {
      const validData = {
        email: 'test@example.com',
        fullName: 'Test User',
        password: 'password123'
      };
      
      const { error } = signupSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    test('should fail with invalid email', () => {
      const invalidData = {
        email: 'notanemail',
        fullName: 'Test User',
        password: 'password123'
      };
      
      const { error } = signupSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('email');
    });

    test('should fail with short password', () => {
      const invalidData = {
        email: 'test@example.com',
        fullName: 'Test User',
        password: '123'
      };
      
      const { error } = signupSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('6 characters');
    });

    test('should fail with short full name', () => {
      const invalidData = {
        email: 'test@example.com',
        fullName: 'A',
        password: 'password123'
      };
      
      const { error } = signupSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('2 characters');
    });

    test('should return all validation errors with abortEarly false', () => {
      const invalidData = {
        email: 'notanemail',
        fullName: 'A',
        password: '12'
      };
      
      const { error } = signupSchema.validate(invalidData, { abortEarly: false });
      expect(error).toBeDefined();
      expect(error.details.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('loginSchema', () => {
    test('should validate correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      const { error } = loginSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    test('should fail without email', () => {
      const invalidData = {
        password: 'password123'
      };
      
      const { error } = loginSchema.validate(invalidData);
      expect(error).toBeDefined();
    });

    test('should fail without password', () => {
      const invalidData = {
        email: 'test@example.com'
      };
      
      const { error } = loginSchema.validate(invalidData);
      expect(error).toBeDefined();
    });
  });

  describe('updateProfileSchema', () => {
    test('should validate profile update', () => {
      const validData = {
        fullName: 'Updated Name'
      };
      
      const { error } = updateProfileSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    test('should allow empty updates', () => {
      const validData = {};
      const { error } = updateProfileSchema.validate(validData);
      expect(error).toBeUndefined();
    });
  });
});

describe('Message Validation Schemas', () => {
  describe('sendMessageSchema', () => {
    test('should validate text message', () => {
      const validData = {
        text: 'Hello world'
      };
      
      const { error } = sendMessageSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    test('should validate image-only message', () => {
      const validData = {
        image: 'base64imagestring'
      };
      
      const { error } = sendMessageSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    test('should validate text and image together', () => {
      const validData = {
        text: 'Check this out!',
        image: 'base64imagestring'
      };
      
      const { error } = sendMessageSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    test('should fail with empty text and no image', () => {
      const invalidData = {
        text: ''
      };
      
      const { error } = sendMessageSchema.validate(invalidData);
      expect(error).toBeDefined();
    });

    test('should fail with text longer than 2000 chars', () => {
      const invalidData = {
        text: 'a'.repeat(2001)
      };
      
      const { error } = sendMessageSchema.validate(invalidData);
      expect(error).toBeDefined();
    });

    test('should fail without text or image', () => {
      const invalidData = {};
      
      const { error } = sendMessageSchema.validate(invalidData);
      expect(error).toBeDefined();
    });
  });

  describe('editMessageSchema', () => {
    test('should validate message edit', () => {
      const validData = {
        text: 'Updated message'
      };
      
      const { error } = editMessageSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    test('should fail with empty text', () => {
      const invalidData = {
        text: ''
      };
      
      const { error } = editMessageSchema.validate(invalidData);
      expect(error).toBeDefined();
    });
  });

  describe('addReactionSchema', () => {
    test('should validate emoji reaction', () => {
      const validData = {
        emoji: '👍'
      };
      
      const { error } = addReactionSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    test('should fail without emoji', () => {
      const invalidData = {};
      const { error } = addReactionSchema.validate(invalidData);
      expect(error).toBeDefined();
    });
  });
});

describe('Group Validation Schemas', () => {
  describe('createGroupSchema', () => {
    test('should validate correct group data', () => {
      const validData = {
        name: 'Test Group',
        description: 'A test group',
        memberIds: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012']
      };
      
      const { error } = createGroupSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    test('should validate with empty memberIds', () => {
      const validData = {
        name: 'Test Group',
        description: 'A test group',
        memberIds: []
      };
      
      const { error } = createGroupSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    test('should fail with empty name', () => {
      const invalidData = {
        name: '',
        description: 'A test group'
      };
      
      const { error } = createGroupSchema.validate(invalidData);
      expect(error).toBeDefined();
    });

    test('should fail with name longer than 100 chars', () => {
      const invalidData = {
        name: 'a'.repeat(101),
        description: 'A test group'
      };
      
      const { error } = createGroupSchema.validate(invalidData);
      expect(error).toBeDefined();
    });

    test('should fail with description longer than 500 chars', () => {
      const invalidData = {
        name: 'Test Group',
        description: 'a'.repeat(501)
      };
      
      const { error } = createGroupSchema.validate(invalidData);
      expect(error).toBeDefined();
    });
  });

  describe('addMembersSchema', () => {
    test('should validate member IDs array', () => {
      const validData = {
        memberIds: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013']
      };
      
      const { error } = addMembersSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    test('should fail with empty array', () => {
      const invalidData = {
        memberIds: []
      };
      
      const { error } = addMembersSchema.validate(invalidData);
      expect(error).toBeDefined();
    });

    test('should fail without memberIds', () => {
      const invalidData = {};
      const { error } = addMembersSchema.validate(invalidData);
      expect(error).toBeDefined();
    });
  });
});