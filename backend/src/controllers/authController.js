import { generateToken } from "../config/utils.js";
import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import cloudinary from "../config/cloudinary.js";

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password) {     
      return res.status(400).json({ 
        success: false,
        message: "All fields are required" 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: "Password must be at least 6 characters" 
      });
    }

    const user = await User.findOne({ email });

    if (user) {
      return res.status(409).json({ 
        success: false,
        message: "Email already exists" 
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    if (newUser) {
      generateToken(newUser._id, res);
      await newUser.save();

      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
      });
    } else {
      res.status(400).json({ 
        success: false,
        message: "Invalid user data" 
      });
    }
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ 
      success: false,
      message: "Internal Server Error" 
    });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    generateToken(user._id, res);

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        profilePic: user.profilePic,
      }
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ 
      success: false,
      message: "Internal Server Error" 
    });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt_T", "", { maxAge: 0 });
    res.status(200).json({ 
      success: true,
      message: "Logged out successfully" 
    });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ 
      success: false,
      message: "Internal Server Error" 
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic, fullName } = req.body;
    const userId = req.user._id;

    const updateData = {};

    if (profilePic) {
      const uploadResponse = await cloudinary.uploader.upload(profilePic);
      updateData.profilePic = uploadResponse.secure_url;
    }

    if (fullName) {
      updateData.fullName = fullName;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ 
        success: false,
        message: "No fields to update" 
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, select: '-password' }
    );

    res.status(200).json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.log("error in update profile:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error" 
    });
  }
};

export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ 
      success: false,
      message: "Internal Server Error" 
    });
  }
};