const allowedTokens = [
  'Bearer dev-secret-token', // 开发用简单 token
];

const allowedIPs = [
  '::1',
  '127.0.0.1',
  '::ffff:127.0.0.1'
];

function authMiddleware(req, res, next) {
  const clientIp = req.ip || req.connection.remoteAddress;
  
  // 本地IP直接放行
  if (allowedIPs.includes(clientIp)) {
    return next();
  }

  // 检查 token
  const authHeader = req.headers.authorization;
  if (authHeader && allowedTokens.includes(authHeader)) {
    return next();
  }

  return res.status(403).json({ error: 'Forbidden' });
}

module.exports = authMiddleware;