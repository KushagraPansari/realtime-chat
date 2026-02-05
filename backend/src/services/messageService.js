import Message from '../models/messageModel.js';
import User from '../models/userModel.js';
import Group from '../models/groupModel.js';
import cloudinary from '../config/cloudinary.js';
import { 
  ValidationError, 
  NotFoundError, 
  AuthorizationError 
} from '../utils/errors/AppError.js';
import { sanitizeMessage, validateBase64Image } from '../utils/sanitize.js';
import { LIMITS, SOCKET_EVENTS } from '../utils/constants.js';
import { emitToUser, emitToGroup } from '../socket/index.js';
import logger from '../utils/logger.js';

class MessageService {

  async getSidebarChats(userId) {
    const usersWithMessages = await User.aggregate([
      { $match: { _id: { $ne: userId } } },
      {
        $lookup: {
          from: 'messages',
          let: { oderId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$isDeleted', false] },
                    {
                      $or: [
                        { $and: [{ $eq: ['$senderId', userId] }, { $eq: ['$receiverId', '$$oderId'] }] },
                        { $and: [{ $eq: ['$senderId', '$$oderId'] }, { $eq: ['$receiverId', userId] }] }
                      ]
                    }
                  ]
                }
              }
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            {
              $project: {
                text: 1,
                createdAt: 1,
                readBy: 1
              }
            }
          ],
          as: 'lastMessageArr'
        }
      },
      {
        $project: {
          _id: 1,
          fullName: 1,
          email: 1,
          profilePic: 1,
          type: { $literal: 'user' },
          lastMessage: { $arrayElemAt: ['$lastMessageArr', 0] }
        }
      }
    ]);

    const formattedUsers = usersWithMessages.map(user => ({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
      type: 'user',
      lastMessage: user.lastMessage ? {
        text: user.lastMessage.text,
        createdAt: user.lastMessage.createdAt,
        isRead: user.lastMessage.readBy?.some(
          r => r.userId.toString() === userId.toString()
        ) || false
      } : null
    }));

    const groups = await Group.find({
      'members.userId': userId
    }).populate('members.userId', 'fullName profilePic');

    const groupsWithMessages = await Promise.all(
      groups.map(async (group) => {
        const lastMessage = await Message.findOne({
          groupId: group._id,
          isDeleted: false
        })
          .sort({ createdAt: -1 })
          .populate('senderId', 'fullName')
          .lean();

        return {
          _id: group._id,
          name: group.name,
          description: group.description,
          avatar: group.avatar,
          members: group.members,
          type: 'group',
          lastMessage: lastMessage ? {
            text: lastMessage.text,
            senderName: lastMessage.senderId?.fullName,
            createdAt: lastMessage.createdAt
          } : null
        };
      })
    );

    const combined = [...formattedUsers, ...groupsWithMessages].sort((a, b) => {
      const aTime = a.lastMessage?.createdAt || new Date(0);
      const bTime = b.lastMessage?.createdAt || new Date(0);
      return new Date(bTime) - new Date(aTime);
    });

    return combined;
  }

  async getMessages(userId, otherUserId, { cursor, limit = LIMITS.DEFAULT_PAGE_SIZE } = {}) {
    const parsedLimit = Math.min(parseInt(limit) || LIMITS.DEFAULT_PAGE_SIZE, LIMITS.MAX_PAGE_SIZE);

    const query = {
      $or: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId }
      ],
      isDeleted: false
    };

    if (cursor) {
      query._id = { $lt: cursor };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parsedLimit)
      .lean();

    const hasMore = messages.length === parsedLimit;
    const nextCursor = hasMore ? messages[messages.length - 1]._id : null;

    return {
      messages: messages.reverse(),
      pagination: { hasMore, nextCursor }
    };
  }

  async sendMessage(senderId, receiverId, { text, image }) {
    if (!text && !image) {
      throw new ValidationError('Message must have text or image');
    }

    let imageUrl;

    if (image) {
      validateBase64Image(image);
      
      try {
        const uploadResult = await cloudinary.uploader.upload(image, {
          folder: 'chat-app/messages',
          transformation: [{ quality: 'auto:good' }]
        });
        imageUrl = uploadResult.secure_url;
      } catch (error) {
        logger.error('Message image upload failed', { error: error.message });
        throw new ValidationError('Failed to upload image');
      }
    }

    const message = new Message({
      senderId,
      receiverId,
      text: text ? sanitizeMessage(text) : undefined,
      image: imageUrl
    });

    await message.save();

    const sent = await emitToUser(receiverId, SOCKET_EVENTS.NEW_MESSAGE, message);
    
    logger.info('Message sent', {
      messageId: message._id,
      senderId,
      receiverId,
      delivered: sent
    });

    return message;
  }

  async sendGroupMessage(senderId, groupId, { text, image }) {
    // Verify group exists and user is a member
    const group = await Group.findById(groupId);
    
    if (!group) {
      throw new NotFoundError('Group');
    }

    const isMember = group.members.some(
      m => m.userId.toString() === senderId.toString()
    );

    if (!isMember) {
      throw new AuthorizationError('You are not a member of this group');
    }

    if (!text && !image) {
      throw new ValidationError('Message must have text or image');
    }

    let imageUrl;

    if (image) {
      validateBase64Image(image);
      
      try {
        const uploadResult = await cloudinary.uploader.upload(image, {
          folder: 'chat-app/messages',
          transformation: [{ quality: 'auto:good' }]
        });
        imageUrl = uploadResult.secure_url;
      } catch (error) {
        logger.error('Group message image upload failed', { error: error.message });
        throw new ValidationError('Failed to upload image');
      }
    }

    const message = new Message({
      senderId,
      groupId,
      text: text ? sanitizeMessage(text) : undefined,
      image: imageUrl
    });

    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'fullName profilePic')
      .lean();

    emitToGroup(groupId.toString(), SOCKET_EVENTS.NEW_GROUP_MESSAGE, populatedMessage);

    logger.info('Group message sent', {
      messageId: message._id,
      senderId,
      groupId
    });

    return populatedMessage;
  }

  async getGroupMessages(userId, groupId, { cursor, limit = LIMITS.DEFAULT_PAGE_SIZE } = {}) {
    const group = await Group.findById(groupId);
    
    if (!group) {
      throw new NotFoundError('Group');
    }

    const isMember = group.members.some(
      m => m.userId.toString() === userId.toString()
    );

    if (!isMember) {
      throw new AuthorizationError('You are not a member of this group');
    }

    const parsedLimit = Math.min(parseInt(limit) || LIMITS.DEFAULT_PAGE_SIZE, LIMITS.MAX_PAGE_SIZE);

    const query = {
      groupId,
      isDeleted: false
    };

    if (cursor) {
      query._id = { $lt: cursor };
    }

    const messages = await Message.find(query)
      .populate('senderId', 'fullName profilePic')
      .sort({ createdAt: -1 })
      .limit(parsedLimit)
      .lean();

    const hasMore = messages.length === parsedLimit;
    const nextCursor = hasMore ? messages[messages.length - 1]._id : null;

    return {
      messages: messages.reverse(),
      pagination: { hasMore, nextCursor }
    };
  }

  async editMessage(userId, messageId, newText) {
    const message = await Message.findById(messageId);

    if (!message) {
      throw new NotFoundError('Message');
    }

    if (message.senderId.toString() !== userId.toString()) {
      throw new AuthorizationError('You can only edit your own messages');
    }

    if (message.isDeleted) {
      throw new ValidationError('Cannot edit deleted message');
    }

    const timeSinceCreation = Date.now() - message.createdAt.getTime();
    if (timeSinceCreation > LIMITS.MESSAGE_EDIT_WINDOW_MS) {
      throw new ValidationError('Cannot edit messages older than 15 minutes');
    }

    message.text = sanitizeMessage(newText);
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    if (message.receiverId) {
      await emitToUser(message.receiverId, SOCKET_EVENTS.MESSAGE_EDITED, {
        messageId,
        text: message.text,
        editedAt: message.editedAt
      });
    }

    logger.info('Message edited', { messageId, userId });

    return message;
  }

  async deleteMessage(userId, messageId) {
    const message = await Message.findById(messageId);

    if (!message) {
      throw new NotFoundError('Message');
    }

    if (message.senderId.toString() !== userId.toString()) {
      throw new AuthorizationError('You can only delete your own messages');
    }

    if (message.isDeleted) {
      throw new ValidationError('Message already deleted');
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();

    if (message.receiverId) {
      await emitToUser(message.receiverId, SOCKET_EVENTS.MESSAGE_DELETED, {
        messageId,
        deletedAt: message.deletedAt
      });
    }

    logger.info('Message deleted', { messageId, userId });
  }

  async addReaction(userId, messageId, emoji) {
    const message = await Message.findById(messageId);

    if (!message) {
      throw new NotFoundError('Message');
    }

    if (message.isDeleted) {
      throw new ValidationError('Cannot react to deleted message');
    }

    const existingReaction = message.reactions.find(
      r => r.userId.toString() === userId.toString() && r.emoji === emoji
    );

    if (existingReaction) {
      throw new ValidationError('You already reacted with this emoji');
    }

    message.reactions.push({ userId, emoji });
    await message.save();

    if (message.receiverId) {
      await emitToUser(message.receiverId, SOCKET_EVENTS.MESSAGE_REACTION, {
        messageId,
        userId,
        emoji,
        action: 'add'
      });
    }

    return message.reactions;
  }

  async removeReaction(userId, messageId, emoji) {
    const message = await Message.findById(messageId);

    if (!message) {
      throw new NotFoundError('Message');
    }

    message.reactions = message.reactions.filter(
      r => !(r.userId.toString() === userId.toString() && r.emoji === emoji)
    );

    await message.save();

    if (message.receiverId) {
      await emitToUser(message.receiverId, SOCKET_EVENTS.MESSAGE_REACTION, {
        messageId,
        userId,
        emoji,
        action: 'remove'
      });
    }

    return message.reactions;
  }

  async markAsRead(userId, senderId) {
    const result = await Message.updateMany(
      {
        senderId,
        receiverId: userId,
        'readBy.userId': { $ne: userId },
        isDeleted: false
      },
      {
        $push: {
          readBy: {
            userId,
            readAt: new Date()
          }
        }
      }
    );

    if (result.modifiedCount > 0) {
      await emitToUser(senderId, SOCKET_EVENTS.MESSAGES_READ, {
        readBy: userId,
        readAt: new Date()
      });
    }

    return result.modifiedCount;
  }
}

export default new MessageService();
