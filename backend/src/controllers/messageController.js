import User from "../models/userModel.js";
import Message from "../models/messageModel.js";
import Group from "../models/groupModel.js";

import cloudinary from "../config/cloudinary.js";
import { getReceiverSocketId, io } from "../config/socket.js";
import { 
  ValidationError, 
  NotFoundError,
  AuthorizationError 
} from "../utils/errors/AppError.js";


export const getUsersForSidebar = async (req, res, next) => {
  try {
    const loggedInUserId = req.user._id;
    
    // Fetching all users except the logged-in user
    const filteredUsers = await User.find({ 
      _id: { $ne: loggedInUserId } 
    }).select("-password");

    // for each user, fetching last message with logged in user
    const usersWithLastMessage = await Promise.all(
      filteredUsers.map(async (user) => {
        const lastMessage = await Message.findOne({
          $or: [
            { senderId: loggedInUserId, receiverId: user._id },
            { senderId: user._id, receiverId: loggedInUserId }
          ],
          isDeleted: false
        }).sort({ createdAt: -1 });

        return {
          ...user.toObject(),
          lastMessage: lastMessage ? {
            text: lastMessage.text,
            createdAt: lastMessage.createdAt,
            isRead: lastMessage.readBy.some(r => r.userId.toString() === loggedInUserId.toString())
          } : null
        };
      })
    );

    res.status(200).json({
      success: true,
      users: usersWithLastMessage
    });
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req, res) => {
    try {
    const { id: userToChatId } = req.params;
    const { cursor, limit = 50 } = req.query;
    const myId = req.user._id;

    const query = {
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId }
      ],
      isDeleted: false
    };

    if (cursor) {
      query._id = { $lt: cursor };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const hasMore = messages.length === parseInt(limit);
    const nextCursor = hasMore ? messages[messages.length - 1]._id : null;

    res.status(200).json({
      success: true,
      messages: messages.reverse(),
      pagination: {
        hasMore,
        nextCursor
      }
    });
  } catch (error) {
    next(error);
  }
}

export const sendMessage = async (req, res) => {
    try {
        const{text,image}=req.body;
        const{id:receiverId}=req.params;
        const senderId=req.user._id;
        
        let imageUrl;
        if(image){
        const uploadResponse=await cloudinary.uploader.upload(image);
        imageUrl=uploadResponse.secure_url;
        }
        const newMessage=new Message({
            senderId,
            receiverId,
            text,
            image:imageUrl
        });

        await newMessage.save();
        
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("newMessage", newMessage);
        }
        //todo:realtime functionality goes here =>socket.io

        res.status(201).json(newMessage);
    } catch (error) {
        console.log("Error in sendMessage",error.message);
        res.status(500).json({message:"Server Error"});
    }
}

export const addReaction = async (req, res, next) => {
  try {
    const { id: messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message) {
      throw new NotFoundError("Message not found");
    }

    if (message.isDeleted) {
      throw new ValidationError("Cannot react to deleted message");
    }

    
    const existingReaction = message.reactions.find(
      r => r.userId.toString() === userId.toString() && r.emoji === emoji
    );

    if (existingReaction) {
      throw new ValidationError("You already reacted with this emoji");
    }

    
    message.reactions.push({ userId, emoji });
    await message.save();

    
    const receiverSocketId = await getReceiverSocketId(message.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageReaction", {
        messageId,
        userId,
        emoji,
        action: "add"
      });
    }

    res.status(200).json({
      success: true,
      message: "Reaction added",
      reactions: message.reactions
    });
  } catch (error) {
    next(error);
  }
};

export const removeReaction = async (req, res, next) => {
  try {
    const { id: messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message) {
      throw new NotFoundError("Message not found");
    }

    message.reactions = message.reactions.filter(
      r => !(r.userId.toString() === userId.toString() && r.emoji === emoji)
    );

    await message.save();

    const receiverSocketId = await getReceiverSocketId(message.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageReaction", {
        messageId,
        userId,
        emoji,
        action: "remove"
      });
    }

    res.status(200).json({
      success: true,
      message: "Reaction removed",
      reactions: message.reactions
    });
  } catch (error) {
    next(error);
  }
};

export const editMessage = async (req, res, next) => {
  try {
    const { id: messageId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message) {
      throw new NotFoundError("Message not found");
    }

    if (message.senderId.toString() !== userId.toString()) {
      throw new AuthorizationError("You can only edit your own messages");
    }

    if (message.isDeleted) {
      throw new ValidationError("Cannot edit deleted message");
    }

    const fifteenMinutes = 15 * 60 * 1000;
    if (Date.now() - message.createdAt.getTime() > fifteenMinutes) {
      throw new ValidationError("Cannot edit messages older than 15 minutes");
    }

    message.text = text;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    const receiverSocketId = await getReceiverSocketId(message.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageEdited", {
        messageId,
        text,
        editedAt: message.editedAt
      });
    }

    res.status(200).json({
      success: true,
      message: "Message edited successfully",
      data: message
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMessage = async (req, res, next) => {
  try {
    const { id: messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message) {
      throw new NotFoundError("Message not found");
    }

    if (message.senderId.toString() !== userId.toString()) {
      throw new AuthorizationError("You can only delete your own messages");
    }

    if (message.isDeleted) {
      throw new ValidationError("Message already deleted");
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();

    const receiverSocketId = await getReceiverSocketId(message.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDeleted", {
        messageId,
        deletedAt: message.deletedAt
      });
    }

    res.status(200).json({
      success: true,
      message: "Message deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};


export const markAsRead = async (req, res, next) => {
  try {
    const { id: senderId } = req.params;
    const userId = req.user._id;
    await Message.updateMany(
      {
        senderId: senderId,
        receiverId: userId,
        'readBy.userId': { $ne: userId },
        isDeleted: false
      },
      {
        $push: {
          readBy: {
            userId: userId,
            readAt: new Date()
          }
        }
      }
    );

    const senderSocketId = await getReceiverSocketId(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesRead", {
        readBy: userId,
        readAt: new Date()
      });
    }
    res.status(200).json({
      success: true,
      message: "Messages marked as read"
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

    const group = await Group.findById(groupId);
    
    if (!group) {
      throw new NotFoundError("Group not found");
    }

    const isMember = group.members.some(
      m => m.userId.toString() === senderId.toString()
    );

    if (!isMember) {
      throw new AuthorizationError("You are not a member of this group");
    }

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      groupId,
      text,
      image: imageUrl
    });

    await newMessage.save();

    const populatedMessage = await Message.findById(newMessage._id)
      .populate('senderId', 'fullName profilePic');

    io.to(groupId.toString()).emit("newGroupMessage", populatedMessage);

    res.status(201).json({
      success: true,
      message: populatedMessage
    });
  } catch (error) {
    next(error);
  }
};


export const getGroupMessages = async (req, res, next) => {
  try {
    const { id: groupId } = req.params;
    const { cursor, limit = 50 } = req.query;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    
    if (!group) {
      throw new NotFoundError("Group not found");
    }

    const isMember = group.members.some(
      m => m.userId.toString() === userId.toString()
    );

    if (!isMember) {
      throw new AuthorizationError("You are not a member of this group");
    }

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
      .limit(parseInt(limit));

    const hasMore = messages.length === parseInt(limit);
    const nextCursor = hasMore ? messages[messages.length - 1]._id : null;

    res.status(200).json({
      success: true,
      messages: messages.reverse(),
      pagination: {
        hasMore,
        nextCursor
      }
    });
  } catch (error) {
    next(error);
  }
};