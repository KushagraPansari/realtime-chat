import Group from "../models/groupModel.js";
import Message from "../models/messageModel.js";
import { 
  ValidationError, 
  NotFoundError,
  AuthorizationError 
} from "../utils/errors/AppError.js";

export const createGroup = async (req, res, next) => {
  try {
    const { name, description, memberIds } = req.body;
    const creatorId = req.user._id;

    const members = [
      { userId: creatorId, role: 'admin' }
    ];

    if (memberIds && memberIds.length > 0) {
      memberIds.forEach(memberId => {
        if (memberId !== creatorId.toString()) {
          members.push({ userId: memberId, role: 'member' });
        }
      });
    }

    const group = new Group({
      name,
      description,
      members,
      createdBy: creatorId
    });

    await group.save();

    const populatedGroup = await Group.findById(group._id)
      .populate('members.userId', 'fullName email profilePic')
      .populate('createdBy', 'fullName email');

    res.status(201).json({
      success: true,
      message: "Group created successfully",
      group: populatedGroup
    });
  } catch (error) {
    next(error);
  }
};

export const getUserGroups = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const groups = await Group.find({
      'members.userId': userId
    })
      .populate('members.userId', 'fullName email profilePic')
      .populate('createdBy', 'fullName email')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      groups
    });
  } catch (error) {
    next(error);
  }
};

export const getGroupDetails = async (req, res, next) => {
  try {
    const { id: groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId)
      .populate('members.userId', 'fullName email profilePic')
      .populate('createdBy', 'fullName email');

    if (!group) {
      throw new NotFoundError("Group not found");
    }

    const isMember = group.members.some(
      m => m.userId._id.toString() === userId.toString()
    );

    if (!isMember) {
      throw new AuthorizationError("You are not a member of this group");
    }

    res.status(200).json({
      success: true,
      group
    });
  } catch (error) {
    next(error);
  }
};

export const addMembers = async (req, res, next) => {
  try {
    const { id: groupId } = req.params;
    const { memberIds } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(groupId);

    if (!group) {
      throw new NotFoundError("Group not found");
    }

    const userMember = group.members.find(
      m => m.userId.toString() === userId.toString()
    );

    if (!userMember || userMember.role !== 'admin') {
      throw new AuthorizationError("Only admins can add members");
    }

    memberIds.forEach(memberId => {
      const alreadyMember = group.members.some(
        m => m.userId.toString() === memberId
      );
      
      if (!alreadyMember) {
        group.members.push({ userId: memberId, role: 'member' });
      }
    });

    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate('members.userId', 'fullName email profilePic');

    res.status(200).json({
      success: true,
      message: "Members added successfully",
      group: updatedGroup
    });
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req, res, next) => {
  try {
    const { id: groupId, memberId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);

    if (!group) {
      throw new NotFoundError("Group not found");
    }

    const userMember = group.members.find(
      m => m.userId.toString() === userId.toString()
    );

    if (!userMember || userMember.role !== 'admin') {
      throw new AuthorizationError("Only admins can remove members");
    }

    if (memberId === group.createdBy.toString()) {
      throw new ValidationError("Cannot remove group creator");
    }

    group.members = group.members.filter(
      m => m.userId.toString() !== memberId
    );

    await group.save();

    res.status(200).json({
      success: true,
      message: "Member removed successfully"
    });
  } catch (error) {
    next(error);
  }
};

export const leaveGroup = async (req, res, next) => {
  try {
    const { id: groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);

    if (!group) {
      throw new NotFoundError("Group not found");
    }

    if (group.createdBy.toString() === userId.toString()) {
      throw new ValidationError("Group creator cannot leave. Delete the group instead.");
    }

    group.members = group.members.filter(
      m => m.userId.toString() !== userId.toString()
    );

    await group.save();

    res.status(200).json({
      success: true,
      message: "Left group successfully"
    });
  } catch (error) {
    next(error);
  }
};

export const deleteGroup = async (req, res, next) => {
  try {
    const { id: groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);

    if (!group) {
      throw new NotFoundError("Group not found");
    }

    if (group.createdBy.toString() !== userId.toString()) {
      throw new AuthorizationError("Only group creator can delete the group");
    }

    await Group.findByIdAndDelete(groupId);

    await Message.updateMany(
      { groupId },
      { isDeleted: true, deletedAt: new Date() }
    );

    res.status(200).json({
      success: true,
      message: "Group deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};