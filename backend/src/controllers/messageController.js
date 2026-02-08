import messageService from '../services/messageService.js';
import { successResponse, createdResponse, paginatedResponse } from '../utils/response.js';
import { asyncHandler } from '../middleware/asyncHandler.js';


export const getUsersForSidebar = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const chats = await messageService.getSidebarChats(userId);
  successResponse(res, { chats });
});

export const getMessages = asyncHandler(async (req, res) => {
  const { id: otherUserId } = req.params;
  const { cursor, limit } = req.query;
  const userId = req.user._id;

  const result = await messageService.getMessages(userId, otherUserId, { cursor, limit });
  
  paginatedResponse(res, result.messages, result.pagination);
});

export const sendMessage = asyncHandler(async (req, res) => {
  const { text, image } = req.body;
  const { id: receiverId } = req.params;
  const senderId = req.user._id;

  const message = await messageService.sendMessage(senderId, receiverId, { text, image });
  
  createdResponse(res, { message });
});

export const addReaction = asyncHandler(async (req, res) => {
  const { id: messageId } = req.params;
  const { emoji } = req.body;
  const userId = req.user._id;

  const reactions = await messageService.addReaction(userId, messageId, emoji);
  
  successResponse(res, { reactions });
});

export const removeReaction = asyncHandler(async (req, res) => {
  const { id: messageId } = req.params;
  const { emoji } = req.body;
  const userId = req.user._id;

  const reactions = await messageService.removeReaction(userId, messageId, emoji);
  
  successResponse(res, { reactions });
});

export const editMessage = asyncHandler(async (req, res) => {
  const { id: messageId } = req.params;
  const { text } = req.body;
  const userId = req.user._id;

  const message = await messageService.editMessage(userId, messageId, text);
  
  successResponse(res, { message });
});

export const deleteMessage = asyncHandler(async (req, res) => {
  const { id: messageId } = req.params;
  const userId = req.user._id;

  await messageService.deleteMessage(userId, messageId);
  
  successResponse(res, { message: 'Message deleted successfully' });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const { id: senderId } = req.params;
  const userId = req.user._id;

  const count = await messageService.markAsRead(userId, senderId);
  
  successResponse(res, { 
    message: 'Messages marked as read',
    count 
  });
});

export const sendGroupMessage = asyncHandler(async (req, res) => {
  const { text, image } = req.body;
  const { id: groupId } = req.params;
  const senderId = req.user._id;

  const message = await messageService.sendGroupMessage(senderId, groupId, { text, image });
  
  createdResponse(res, { message });
});

export const getGroupMessages = asyncHandler(async (req, res) => {
  const { id: groupId } = req.params;
  const { cursor, limit } = req.query;
  const userId = req.user._id;

  const result = await messageService.getGroupMessages(userId, groupId, { cursor, limit });
  
  paginatedResponse(res, result.messages, result.pagination);
});