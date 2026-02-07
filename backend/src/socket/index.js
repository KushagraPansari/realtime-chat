import { Server } from 'socket.io';
import logger from '../utils/logger.js';
import { SOCKET_EVENTS, ENVIRONMENTS } from '../utils/constants.js';
import { socketAuthMiddleware } from './auth.js';
import { createConnectionHandler } from './handlers/connection.js';
import { createTypingHandler } from './handlers/typing.js';
import { createGroupHandler } from './handlers/groups.js';


let io = null;
let connectionHandler = null;

export const initializeSocket = async (httpServer, options = {}) => {
  const { clientUrl, redis = null } = options;
  
  let useRedis = false;
  if (redis) {
    try {
      await redis.ping();
      useRedis = true;
      logger.info('Socket.io using Redis for online users');
    } catch (error) {
      logger.warn('Redis not available, using in-memory store (single server only)');
    }
  }

  io = new Server(httpServer, {
    cors: {
      origin: [clientUrl || 'http://localhost:5173'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  if (process.env.NODE_ENV !== ENVIRONMENTS.TEST) {
    io.use(socketAuthMiddleware);
  }

  connectionHandler = createConnectionHandler(io, redis, useRedis);
  const typingHandler = createTypingHandler(io, connectionHandler.getReceiverSocketId);
  const groupHandler = createGroupHandler(io);

  if (process.env.NODE_ENV === ENVIRONMENTS.TEST) {
    logger.info('Socket.io initialized in test mode (no event handlers)');
    return io;
  }

  io.on(SOCKET_EVENTS.CONNECTION, async (socket) => {
    await connectionHandler.handleConnection(socket);

    
    socket.on(SOCKET_EVENTS.JOIN_GROUP, (groupId) => {
      groupHandler.handleJoinGroup(socket, groupId);
    });

    socket.on(SOCKET_EVENTS.LEAVE_GROUP, (groupId) => {
      groupHandler.handleLeaveGroup(socket, groupId);
    });

    socket.on(SOCKET_EVENTS.TYPING, (data) => {
      typingHandler.handleTyping(socket, data);
    });

    socket.on(SOCKET_EVENTS.GROUP_TYPING, (data) => {
      typingHandler.handleGroupTyping(socket, data);
    });

    socket.on(SOCKET_EVENTS.DISCONNECT, async () => {
      typingHandler.cleanupUserTyping(socket.userId);
      
      groupHandler.leaveAllGroups(socket);
      
      await connectionHandler.handleDisconnect(socket);
    });
  });

  logger.info('Socket.io initialized successfully');
  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initializeSocket first.');
  }
  return io;
};

export const getReceiverSocketId = async (userId) => {
  if (!connectionHandler) {
    return null;
  }
  return connectionHandler.getReceiverSocketId(userId);
};

export const getOnlineUsers = async () => {
  if (!connectionHandler) {
    throw new Error('Socket.io not initialized');
  }
  return connectionHandler.getOnlineUsers();
};

export const emitToUser = async (userId, event, data) => {
  if (!io) return;
  const socketId = await getReceiverSocketId(userId);
  if (socketId) {
    io.to(socketId).emit(event, data);
  }
};

export const emitToGroup = async (groupId, event, data, excludeUserId = null) => {
  if (!io) return;
  if (excludeUserId) {
    const senderSocketId = await getReceiverSocketId(excludeUserId);
    if (senderSocketId) {
      const senderSocket = io.sockets.sockets.get(senderSocketId);
      if (senderSocket) {
        senderSocket.to(groupId).emit(event, data);
        return;
      }
    }
  }
  io.to(groupId).emit(event, data);
};

export { io };
