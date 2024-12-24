import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import path from 'path';

import authRoutes from './routes/authRoute.js';
import messageRoutes from './routes/messageRoute.js';
import {connectDB} from './config/db.js';

import { app, server } from "./config/socket.js";


dotenv.config();

app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
      origin: "http://localhost:5173",
      credentials: true,
    })
  );

app.use('/api/auth',authRoutes)
app.use('/api/messages',messageRoutes)

const PORT = process.env.PORT
const __dirname = path.resolve(); 

if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../frontend/dist")));
  
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
    });
  }

server.listen(PORT, () => {
    console.log("server is running on port PORT:"+PORT);
    connectDB();
});