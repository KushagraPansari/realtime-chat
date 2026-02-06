import messageService from '../services/messageService.js';
import { successResponse, createdResponse, paginatedResponse } from '../utils/response.js';


export const getUsersForSidebar = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const chats = await messageService.getSidebarChats(userId);
    successResponse(res, { chats });
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req, res, next) => {
    try { 
    const { id: otherUserId } = req.params;
    const { cursor, limit } = req.query;
    const userId = req.user._id;

    const result = await messageService.getMessages(userId, otherUserId, { cursor, limit });
    
    paginatedResponse(res, result.messages, result.pagination);
  } catch (error) {
    next(error);
  }
}

export const sendMessage = async (req, res, next) => {
    try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    const message = await messageService.sendMessage(senderId, receiverId, { text, image });
    
    createdResponse(res, { message });
  } catch (error) {
        next(error);
    }
}

export const addReaction = async (req, res, next) => {
  try {
    const { id: messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    const reactions = await messageService.addReaction(userId, messageId, emoji);
    
    successResponse(res, { reactions });
  } catch (error) {
    next(error);
  }
};

export const removeReaction = async (req, res, next) => {
  try {
    const { id: messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    const reactions = await messageService.removeReaction(userId, messageId, emoji);
    
    successResponse(res, { reactions });
  } catch (error) {
    next(error);
  }
};

export const editMessage = async (req, res, next) => {
  try {    
    const { id: messageId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    const message = await messageService.editMessage(userId, messageId, text);
    
    successResponse(res, { message });
  } catch (error) {
    next(error);
  }
};

export const deleteMessage = async (req, res, next) => {
  try { 
    const { id: messageId } = req.params;
    const userId = req.user._id;

    await messageService.deleteMessage(userId, messageId);
    
    successResponse(res, { message: 'Message deleted successfully' });
  } catch (error) {
    next(error);
  }
};


export const markAsRead = async (req, res, next) => {
  try {
    const { id: senderId } = req.params;
    const userId = req.user._id;

    const count = await messageService.markAsRead(userId, senderId);
    
    successResponse(res, { 
      message: 'Messages marked as read',
      count 
    });
  } catch (error) {
    next(error);
  }
};


export const sendGroupMessage = async (req, res, next) => {
  try {
    const { text, image } = req.body;
    const { id: groupId } = req.params;
    const senderId = req.user._id;

    const message = await messageService.sendGroupMessage(senderId, groupId, { text, image });
    
    createdResponse(res, { message });
  } catch (error) {
    next(error);
  }
};


export const getGroupMessages = async (req, res, next) => {
  try { 
    const { id: groupId } = req.params;
    const { cursor, limit } = req.query;
    const userId = req.user._id;

    const result = await messageService.getGroupMessages(userId, groupId, { cursor, limit });
    
    paginatedResponse(res, result.messages, result.pagination);
  } catch (error) {
    next(error);
  }
};