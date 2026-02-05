import Group from '../models/groupModel.js';
import Message from '../models/messageModel.js';
import { 
  ValidationError, 
  NotFoundError, 
  AuthorizationError 
} from '../utils/errors/AppError.js';
import { sanitizeName } from '../utils/sanitize.js';
import { LIMITS, GROUP_ROLES } from '../utils/constants.js';
import logger from '../utils/logger.js';


class GroupService {


  async createGroup(creatorId, { name, description, memberIds = [] }) {
    const sanitizedName = sanitizeName(name);
    
    if (!sanitizedName) {
      throw new ValidationError('Group name cannot be empty');
    }

    const members = [
      { userId: creatorId, role: GROUP_ROLES.ADMIN }
    ];

    const uniqueMemberIds = [...new Set(memberIds)];
    uniqueMemberIds.forEach(memberId => {
      if (memberId.toString() !== creatorId.toString()) {
        members.push({ userId: memberId, role: GROUP_ROLES.MEMBER });
      }
    });

    if (members.length > LIMITS.MAX_GROUP_MEMBERS) {
      throw new ValidationError(`Group cannot have more than ${LIMITS.MAX_GROUP_MEMBERS} members`);
    }

    const group = new Group({
      name: sanitizedName,
      description: description ? sanitizeName(description, 200) : '',
      members,
      createdBy: creatorId
    });

    await group.save();

    const populatedGroup = await this.getGroupById(group._id);

    logger.info('Group created', {
      groupId: group._id,
      creatorId,
      memberCount: members.length
    });

    return populatedGroup;
  }

  async getGroupById(groupId) {
    const group = await Group.findById(groupId)
      .populate('members.userId', 'fullName email profilePic')
      .populate('createdBy', 'fullName email')
      .lean();

    if (!group) {
      throw new NotFoundError('Group');
    }

    return group;
  }

  async getGroupDetails(userId, groupId) {
    const group = await this.getGroupById(groupId);

    const isMember = group.members.some(
      m => m.userId._id.toString() === userId.toString()
    );

    if (!isMember) {
      throw new AuthorizationError('You are not a member of this group');
    }

    return group;
  }

  async getUserGroups(userId) {
    const groups = await Group.find({
      'members.userId': userId
    })
      .populate('members.userId', 'fullName email profilePic')
      .populate('createdBy', 'fullName email')
      .sort({ updatedAt: -1 })
      .lean();

    return groups;
  }

  async addMembers(userId, groupId, memberIds) {
    const group = await Group.findById(groupId);

    if (!group) {
      throw new NotFoundError('Group');
    }

    this.verifyAdminRole(group, userId);

    let addedCount = 0;
    memberIds.forEach(memberId => {
      const alreadyMember = group.members.some(
        m => m.userId.toString() === memberId.toString()
      );

      if (!alreadyMember) {
        group.members.push({ userId: memberId, role: GROUP_ROLES.MEMBER });
        addedCount++;
      }
    });

    if (group.members.length > LIMITS.MAX_GROUP_MEMBERS) {
      throw new ValidationError(`Group cannot have more than ${LIMITS.MAX_GROUP_MEMBERS} members`);
    }

    if (addedCount > 0) {
      await group.save();
      logger.info('Members added to group', { groupId, addedCount, byUserId: userId });
    }

    return this.getGroupById(groupId);
  }

  async removeMember(userId, groupId, memberId) {
    const group = await Group.findById(groupId);

    if (!group) {
      throw new NotFoundError('Group');
    }

    this.verifyAdminRole(group, userId);

    if (memberId.toString() === group.createdBy.toString()) {
      throw new ValidationError('Cannot remove group creator');
    }

    const initialLength = group.members.length;
    group.members = group.members.filter(
      m => m.userId.toString() !== memberId.toString()
    );

    if (group.members.length === initialLength) {
      throw new NotFoundError('Member in group');
    }

    await group.save();

    logger.info('Member removed from group', {
      groupId,
      removedUserId: memberId,
      byUserId: userId
    });
  }

  async leaveGroup(userId, groupId) {
    const group = await Group.findById(groupId);

    if (!group) {
      throw new NotFoundError('Group');
    }

    if (group.createdBy.toString() === userId.toString()) {
      throw new ValidationError('Group creator cannot leave. Delete the group instead.');
    }

    const isMember = group.members.some(
      m => m.userId.toString() === userId.toString()
    );

    if (!isMember) {
      throw new AuthorizationError('You are not a member of this group');
    }

    group.members = group.members.filter(
      m => m.userId.toString() !== userId.toString()
    );

    await group.save();

    logger.info('User left group', { groupId, userId });
  }

  async deleteGroup(userId, groupId) {
    const group = await Group.findById(groupId);

    if (!group) {
      throw new NotFoundError('Group');
    }

    if (group.createdBy.toString() !== userId.toString()) {
      throw new AuthorizationError('Only group creator can delete the group');
    }

    await Group.findByIdAndDelete(groupId);

    await Message.updateMany(
      { groupId },
      { isDeleted: true, deletedAt: new Date() }
    );

    logger.info('Group deleted', { groupId, userId });
  }

  async updateGroup(userId, groupId, { name, description }) {
    const group = await Group.findById(groupId);

    if (!group) {
      throw new NotFoundError('Group');
    }

    this.verifyAdminRole(group, userId);

    const updates = {};

    if (name !== undefined) {
      const sanitizedName = sanitizeName(name);
      if (!sanitizedName) {
        throw new ValidationError('Group name cannot be empty');
      }
      updates.name = sanitizedName;
    }

    if (description !== undefined) {
      updates.description = sanitizeName(description, 200);
    }

    if (Object.keys(updates).length === 0) {
      throw new ValidationError('No fields to update');
    }

    await Group.findByIdAndUpdate(groupId, updates);

    logger.info('Group updated', { groupId, fields: Object.keys(updates) });

    return this.getGroupById(groupId);
  }

  async promoteMember(userId, groupId, memberId) {
    const group = await Group.findById(groupId);

    if (!group) {
      throw new NotFoundError('Group');
    }

    this.verifyAdminRole(group, userId);

    const member = group.members.find(
      m => m.userId.toString() === memberId.toString()
    );

    if (!member) {
      throw new NotFoundError('Member in group');
    }

    if (member.role === GROUP_ROLES.ADMIN) {
      throw new ValidationError('User is already an admin');
    }

    member.role = GROUP_ROLES.ADMIN;
    await group.save();

    logger.info('Member promoted to admin', { groupId, memberId, byUserId: userId });

    return this.getGroupById(groupId);
  }

  verifyAdminRole(group, userId) {
    const userMember = group.members.find(
      m => m.userId.toString() === userId.toString()
    );

    if (!userMember || userMember.role !== GROUP_ROLES.ADMIN) {
      throw new AuthorizationError('Only admins can perform this action');
    }
  }
}

export default new GroupService();
