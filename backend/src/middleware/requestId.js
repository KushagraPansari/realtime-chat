const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const requestIdMiddleware = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || generateUUID();
  
  req.id = requestId;
  
  res.setHeader('X-Request-ID', requestId);
  
  next();
};

export default requestIdMiddleware;
