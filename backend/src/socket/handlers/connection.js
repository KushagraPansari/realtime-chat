import logger from '../../utils/logger.js';
import { REDIS_KEYS, SOCKET_EVENTS } from '../../utils/constants.js';

const userSocketMap = new Map();

export const createConnectionHandler = (io, redis, useRedis) => {
  
  const getReceiverSocketId = async (userId) => {
    if (!userId) return null;
    
    const userIdStr = userId.toString();
    
    if (useRedis) {
      try {
        return await redis.hget(REDIS_KEYS.ONLINE_USERS, userIdStr);
      } catch (error) {
        logger.error('Redis error getting socket ID', { error: error.message, userId });
        return userSocketMap.get(userIdStr) || null;
      }
    }
    
    return userSocketMap.get(userIdStr) || null;
  };
  const getOnlineUsers = async () => {
    if (useRedis) {
      try {
        return await redis.hkeys(REDIS_KEYS.ONLINE_USERS);
      } catch (error) {
        logger.error('Redis error getting online users', { error: error.message });
        return Array.from(userSocketMap.keys());
      }
    }
    
    return Array.from(userSocketMap.keys());
  };

  const addOnlineUser = async (userId, socketId) => {
    const userIdStr = userId.toString();
    
    if (useRedis) {
      try {
        await redis.hset(REDIS_KEYS.ONLINE_USERS, userIdStr, socketId);
      } catch (error) {
        logger.error('Redis error adding online user', { error: error.message, userId });
      }
    }
    
    userSocketMap.set(userIdStr, socketId);
  };

  const removeOnlineUser = async (userId) => {
    const userIdStr = userId.toString();
    
    if (useRedis) {
      try {
        await redis.hdel(REDIS_KEYS.ONLINE_USERS, userIdStr);
      } catch (error) {
        logger.error('Redis error removing online user', { error: error.message, userId });
      }
    }
    
    userSocketMap.delete(userIdStr);
  };
  const broadcastOnlineUsers = async () => {
    const onlineUsers = await getOnlineUsers();
    io.emit(SOCKET_EVENTS.GET_ONLINE_USERS, onlineUsers);
  };

  const handleConnection = async (socket) => {
    const { userId } = socket;
    
    logger.info('User connected', {
      userId,
      socketId: socket.id,
      ip: socket.handshake.address
    });

    await addOnlineUser(userId, socket.id);
    
    await broadcastOnlineUsers();
  };

  const handleDisconnect = async (socket) => {
    const { userId } = socket;
    
    logger.info('User disconnected', {
      userId,
      socketId: socket.id
    });

    await removeOnlineUser(userId);
    
    await broadcastOnlineUsers();
  };

  return {
    handleConnection,
    handleDisconnect,
    getReceiverSocketId,
    getOnlineUsers,
    broadcastOnlineUsers
  };
};

export default createConnectionHandler;
