import { Server } from "socket.io";
import http from "http";
import express from "express";
import logger from "../utils/logger.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [process.env.CLIENT_URL || "http://localhost:5173"],
    credentials: true
  },
});

let redis;
let useRedis = false;

try {
  const redisModule = await import('./redis.js');
  redis = redisModule.default;
  await redis.ping();
  useRedis = true;
  logger.info('Socket.io using Redis for online users');
} catch (error) {
  logger.warn('Redis not available, using in-memory for online users (single server only)');
  useRedis = false;
}

const userSocketMap = {};
const ONLINE_USERS_KEY = 'online_users';

export async function getReceiverSocketId(userId) {
  if (useRedis) {
    try {
      return await redis.hget(ONLINE_USERS_KEY, userId.toString());
    } catch (error) {
      logger.error('Error getting receiver socket ID:', error);
      return null;
    }
  } else {
    return userSocketMap[userId];
  }
}

export async function getOnlineUsers() {
  if (useRedis) {
    try {
      return await redis.hkeys(ONLINE_USERS_KEY);
    } catch (error) {
      logger.error('Error getting online users:', error);
      return [];
    }
  } else {
    return Object.keys(userSocketMap);
  }
}

io.on("connection", async (socket) => {
  logger.info("User connected:", socket.id);

  const userId = socket.handshake.query.userId;
  
  if (userId && userId !== 'undefined') {
    if (useRedis) {
      try {
        await redis.hset(ONLINE_USERS_KEY, userId.toString(), socket.id);
      } catch (error) {
        logger.error('Error adding user to online list:', error);
      }
    } else {
      userSocketMap[userId] = socket.id;
    }
    
    const onlineUsers = await getOnlineUsers();
    io.emit("getOnlineUsers", onlineUsers);
    logger.info(`User ${userId} is now online`);
  }

  socket.on("joinGroup", (groupId) => {
    socket.join(groupId);
    logger.info(`User ${userId} joined group ${groupId}`);
  });

  socket.on("leaveGroup", (groupId) => {
    socket.leave(groupId);
    logger.info(`User ${userId} left group ${groupId}`);
  });

  socket.on("typing", (receiverId) => {
    const receiverSocketId = userSocketMap[receiverId] || null;
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userTyping", userId);
    }
  });

  socket.on("groupTyping", (groupId) => {
    socket.to(groupId).emit("userGroupTyping", { userId, groupId });
  });

  socket.on("disconnect", async () => {
    logger.info("User disconnected:", socket.id);
    
    if (userId && userId !== 'undefined') {
      if (useRedis) {
        try {
          await redis.hdel(ONLINE_USERS_KEY, userId.toString());
        } catch (error) {
          logger.error('Error removing user from online list:', error);
        }
      } else {
        delete userSocketMap[userId];
      }
      
      const onlineUsers = await getOnlineUsers();
      io.emit("getOnlineUsers", onlineUsers);
      logger.info(`User ${userId} is now offline`);
    }
  });
});

export { io, app, server };