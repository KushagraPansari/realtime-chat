
export const AUTH = {
  SALT_ROUNDS: 10,
  JWT_EXPIRES_IN: '7d',
  COOKIE_NAME: 'jwt_T',
  COOKIE_MAX_AGE: 7 * 24 * 60 * 60 * 1000,
};

export const MESSAGES = {
  MAX_LENGTH: 2000,
  EDIT_WINDOW_MS: 15 * 60 * 1000,
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,
};

export const LIMITS = {
  TYPING_TIMEOUT_MS: 3000,
  MAX_MESSAGE_LENGTH: 2000,
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,
  MESSAGE_EDIT_WINDOW_MS: 15 * 60 * 1000,
};

export const GROUPS = {
  MAX_MEMBERS: 50,
  NAME_MIN_LENGTH: 1,
  NAME_MAX_LENGTH: 100,
};

export const UPLOADS = {
  MAX_IMAGE_SIZE: 5 * 1024 * 1024,
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_EXTENSIONS: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
};

export const RATE_LIMITS = {
  AUTH: {
    WINDOW_MS: 15 * 60 * 1000,
    MAX_REQUESTS: 5,
  },
  API: {
    WINDOW_MS: 15 * 60 * 1000,
    MAX_REQUESTS: 100,
  },
  MESSAGE: {
    WINDOW_MS: 60 * 1000,
    MAX_REQUESTS: 20,
  },
};

export const REDIS_KEYS = {
  ONLINE_USERS: 'online_users',
  RATE_LIMIT_PREFIX: 'rl:',
};

export const SOCKET_EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  
  JOIN_GROUP: 'joinGroup',
  LEAVE_GROUP: 'leaveGroup',
  TYPING: 'typing',
  GROUP_TYPING: 'groupTyping',
  
  GET_ONLINE_USERS: 'getOnlineUsers',
  ONLINE_USERS: 'getOnlineUsers',
  NEW_MESSAGE: 'newMessage',
  NEW_GROUP_MESSAGE: 'newGroupMessage',
  USER_TYPING: 'userTyping',
  USER_GROUP_TYPING: 'userGroupTyping',
  MESSAGE_EDITED: 'messageEdited',
  MESSAGE_DELETED: 'messageDeleted',
  MESSAGE_REACTION: 'messageReaction',
  MESSAGES_READ: 'messagesRead',
  ERROR: 'error',
};

export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};
