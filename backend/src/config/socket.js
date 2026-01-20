import { Server } from "socket.io";
import http from "http";
import express from "express";
import redis from "./redis.js";
import logger from "../utils/logger.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [process.env.CLIENT_URL || "http://localhost:5173"],
    credentials: true
  },
});


const ONLINE_USERS_KEY = 'online_users';

export async function getReceiverSocketId(userId) {
  try {
    return await redis.hget(ONLINE_USERS_KEY, userId.toString());
  } catch (error) {
    logger.error('Error getting receiver socket ID:', error);
    return null;
  }
}

export async function getOnlineUsers() {
  try {
    const users = await redis.hkeys(ONLINE_USERS_KEY);
    return users;
  } catch (error) {
    logger.error('Error getting online users:', error);
    return [];
  }
}

io.on("connection", async (socket) => {
  logger.info("User connected:", socket.id);

  const userId = socket.handshake.query.userId;
  
  if (userId && userId !== 'undefined') {
    try {
      await redis.hset(ONLINE_USERS_KEY, userId.toString(), socket.id);
      
      const onlineUsers = await getOnlineUsers();
      io.emit("getOnlineUsers", onlineUsers);
      
      logger.info(`User ${userId} is now online`);
    } catch (error) {
      logger.error('Error adding user to online list:', error);
    }
  }

  socket.on("disconnect", async () => {
    logger.info("User disconnected:", socket.id);
    
    if (userId && userId !== 'undefined') {
      try {

        await redis.hdel(ONLINE_USERS_KEY, userId.toString());
        
        const onlineUsers = await getOnlineUsers();
        io.emit("getOnlineUsers", onlineUsers);
        
        logger.info(`User ${userId} is now offline`);
      } catch (error) {
        logger.error('Error removing user from online list:', error);
      }
    }
  });
});

export { io, app, server };