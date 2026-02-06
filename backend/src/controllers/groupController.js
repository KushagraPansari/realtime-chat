import groupService from "../services/groupService.js";
import { successResponse, createdResponse } from "../utils/response.js";


export const createGroup = async (req, res, next) => {
  try { 
    const { name, description, memberIds } = req.body;
    const group = await groupService.createGroup(req.user._id, {
      name,
      description,
      memberIds,
    });
    createdResponse(res, { message: "Group created successfully", group });
  } catch (error) {
    next(error);
  }
};

export const getUserGroups = async (req, res, next) => {
  try { 
    const groups = await groupService.getUserGroups(req.user._id);
    successResponse(res, { groups });
  } catch (error) {
    next(error);
  }
};

export const getGroupDetails = async (req, res, next) => {
  try {    
    const group = await groupService.getGroupDetails(req.user._id, req.params.id);
    successResponse(res, { group });
  } catch (error) {
    next(error);
  }
};

export const updateGroup = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const group = await groupService.updateGroup(req.user._id, req.params.id, {
      name,
      description,
    });
    successResponse(res, { message: "Group updated successfully", group });
  } catch (error) {
    next(error);
  }
};

export const addMembers = async (req, res, next) => {
  try {    
    const { memberIds } = req.body;
    const group = await groupService.addMembers(req.user._id, req.params.id, memberIds);
    successResponse(res, { message: "Members added successfully", group });
} catch (error) {
    next(error);
  }
};

export const removeMember = async (req, res, next) => {
  try {  
    await groupService.removeMember(req.user._id, req.params.id, req.params.memberId);
    successResponse(res, { message: "Member removed successfully" });
  } catch (error) {
    next(error);
  }
};

export const promoteMember = async (req, res, next) => {
  try {
    const group = await groupService.promoteMember(req.user._id, req.params.id, req.params.memberId);
    successResponse(res, { message: "Member promoted to admin", group });
  } catch (error) {
    next(error);
  }
};

export const leaveGroup = async (req, res, next) => {
  try { 
    await groupService.leaveGroup(req.user._id, req.params.id);
    successResponse(res, { message: "Left group successfully" });
  } catch (error) {
    next(error);
  }
};

export const deleteGroup = async (req, res, next) => {
  try { 
    await groupService.deleteGroup(req.user._id, req.params.id);
    successResponse(res, { message: "Group deleted successfully" });
  } catch (error) {
    next(error);
  }
};