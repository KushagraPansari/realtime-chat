import timeout from 'express-timeout-handler';

export const timeoutMiddleware = timeout.handler({
  timeout: 30000,
  onTimeout: (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Request timeout - Server took too long to respond'
    });
  },
  disable: ['write', 'setHeaders', 'send', 'json', 'end']
});