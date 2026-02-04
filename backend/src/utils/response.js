import { HTTP_STATUS } from './constants.js';

export const successResponse = (res, data = null, statusCode = HTTP_STATUS.OK) => {
  const response = {
    success: true,
    ...(data !== null && { data }),
    timestamp: new Date().toISOString()
  };
  
  return res.status(statusCode).json(response);
};

export const createdResponse = (res, data) => {
  return successResponse(res, data, HTTP_STATUS.CREATED);
};

export const paginatedResponse = (res, items, pagination) => {
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: items,
    pagination: {
      hasMore: pagination.hasMore,
      nextCursor: pagination.nextCursor,
      ...(pagination.total !== undefined && { total: pagination.total }),
      ...(pagination.page !== undefined && { page: pagination.page }),
      ...(pagination.limit !== undefined && { limit: pagination.limit })
    },
    timestamp: new Date().toISOString()
  });
};

export const errorResponse = (res, message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, details = null) => {
  const response = {
    success: false,
    error: {
      message,
      ...(details && { details })
    },
    timestamp: new Date().toISOString()
  };
  
  return res.status(statusCode).json(response);
};

export const noContentResponse = (res) => {
  return res.status(HTTP_STATUS.NO_CONTENT).end();
};
