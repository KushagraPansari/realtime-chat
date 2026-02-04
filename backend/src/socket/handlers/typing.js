import logger from '../../utils/logger.js';
import { SOCKET_EVENTS, LIMITS } from '../../utils/constants.js';

const typingTimeouts = new Map();

export const createTypingHandler = (io, getReceiverSocketId) => {
  const clearTypingTimeout = (key) => {
    const timeout = typingTimeouts.get(key);
    if (timeout) {
      clearTimeout(timeout);
      typingTimeouts.delete(key);
    }
  };

  const handleTyping = async (socket, { receiverId, isTyping }) => {
    const { userId } = socket;
    
    if (!receiverId) {
      logger.warn('Typing event missing receiverId', { userId });
      return;
    }

    const receiverSocketId = await getReceiverSocketId(receiverId);
    
    if (!receiverSocketId) {
      return;
    }

    const timeoutKey = `dm:${userId}:${receiverId}`;

    if (isTyping) {
      io.to(receiverSocketId).emit(SOCKET_EVENTS.USER_TYPING, {
        userId,
        isTyping: true
      });

      clearTypingTimeout(timeoutKey);

      const timeout = setTimeout(() => {
        io.to(receiverSocketId).emit(SOCKET_EVENTS.USER_TYPING, {
          userId,
          isTyping: false
        });
        typingTimeouts.delete(timeoutKey);
      }, LIMITS.TYPING_TIMEOUT_MS);

      typingTimeouts.set(timeoutKey, timeout);
    } else {
      io.to(receiverSocketId).emit(SOCKET_EVENTS.USER_TYPING, {
        userId,
        isTyping: false
      });

      clearTypingTimeout(timeoutKey);
    }
  };

  const handleGroupTyping = (socket, { groupId, isTyping }) => {
    const { userId } = socket;
    
    if (!groupId) {
      logger.warn('Group typing event missing groupId', { userId });
      return;
    }

    const timeoutKey = `group:${userId}:${groupId}`;

    if (isTyping) {
      socket.to(groupId).emit(SOCKET_EVENTS.USER_GROUP_TYPING, {
        userId,
        groupId,
        isTyping: true
      });

      clearTypingTimeout(timeoutKey);

      const timeout = setTimeout(() => {
        socket.to(groupId).emit(SOCKET_EVENTS.USER_GROUP_TYPING, {
          userId,
          groupId,
          isTyping: false
        });
        typingTimeouts.delete(timeoutKey);
      }, LIMITS.TYPING_TIMEOUT_MS);

      typingTimeouts.set(timeoutKey, timeout);
    } else {
      socket.to(groupId).emit(SOCKET_EVENTS.USER_GROUP_TYPING, {
        userId,
        groupId,
        isTyping: false
      });

      clearTypingTimeout(timeoutKey);
    }
  };

  const cleanupUserTyping = (userId) => {
    const keysToDelete = [];
    
    for (const [key] of typingTimeouts) {
      if (key.includes(`:${userId}:`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => clearTypingTimeout(key));
    
    logger.debug('Cleaned up typing timeouts', { userId, count: keysToDelete.length });
  };

  return {
    handleTyping,
    handleGroupTyping,
    cleanupUserTyping
  };
};

export default createTypingHandler;
