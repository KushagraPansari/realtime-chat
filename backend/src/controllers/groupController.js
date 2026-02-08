import groupService from "../services/groupService.js";
import { successResponse, createdResponse } from "../utils/response.js";
import { asyncHandler } from "../middleware/asyncHandler.js";


export const createGroup = asyncHandler(async (req, res) => {
  const { name, description, memberIds } = req.body;
  const group = await groupService.createGroup(req.user._id, {
    name,
    description,
    memberIds,
  });
  createdResponse(res, { message: "Group created successfully", group });
});

export const getUserGroups = asyncHandler(async (req, res) => {
  const groups = await groupService.getUserGroups(req.user._id);
  successResponse(res, { groups });
});

export const getGroupDetails = asyncHandler(async (req, res) => {
  const group = await groupService.getGroupDetails(req.user._id, req.params.id);
  successResponse(res, { group });
});

export const updateGroup = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const group = await groupService.updateGroup(req.user._id, req.params.id, {
    name,
    description,
  });
  successResponse(res, { message: "Group updated successfully", group });
});

export const addMembers = asyncHandler(async (req, res) => {
  const { memberIds } = req.body;
  const group = await groupService.addMembers(req.user._id, req.params.id, memberIds);
  successResponse(res, { message: "Members added successfully", group });
});

export const removeMember = asyncHandler(async (req, res) => {
  await groupService.removeMember(req.user._id, req.params.id, req.params.memberId);
  successResponse(res, { message: "Member removed successfully" });
});

export const promoteMember = asyncHandler(async (req, res) => {
  const group = await groupService.promoteMember(req.user._id, req.params.id, req.params.memberId);
  successResponse(res, { message: "Member promoted to admin", group });
});

export const leaveGroup = asyncHandler(async (req, res) => {
  await groupService.leaveGroup(req.user._id, req.params.id);
  successResponse(res, { message: "Left group successfully" });
});

export const deleteGroup = asyncHandler(async (req, res) => {
  await groupService.deleteGroup(req.user._id, req.params.id);
  successResponse(res, { message: "Group deleted successfully" });
});