import logger from '../../utils/logger.js';

export const createGroupHandler = (io) => {
  const handleJoinGroup = (socket, groupId) => {
    const { userId } = socket;
    
    if (!groupId) {
      logger.warn('Join group event missing groupId', { userId });
      return;
    }

    socket.join(groupId);
    
    logger.debug('User joined group room', {
      userId,
      groupId,
      socketId: socket.id
    });
  };

  const handleLeaveGroup = (socket, groupId) => {
    const { userId } = socket;
    
    if (!groupId) {
      logger.warn('Leave group event missing groupId', { userId });
      return;
    }

    socket.leave(groupId);
    
    logger.debug('User left group room', {
      userId,
      groupId,
      socketId: socket.id
    });
  };

  const leaveAllGroups = (socket) => {
    const rooms = Array.from(socket.rooms);
    rooms.forEach(room => {
      if (room !== socket.id) {
        socket.leave(room);
      }
    });
    
    logger.debug('User left all group rooms', {
      userId: socket.userId,
      roomCount: rooms.length - 1
    });
  };

  return {
    handleJoinGroup,
    handleLeaveGroup,
    leaveAllGroups
  };
};

export default createGroupHandler;
