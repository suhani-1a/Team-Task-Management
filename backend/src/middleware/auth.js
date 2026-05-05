const User = require('../models/User');
const { verifyToken } = require('../utils/token');

module.exports = async function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Authentication required' });

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  const user = await User.findById(decoded.sub);
  if (!user) return res.status(401).json({ message: 'User no longer exists' });

  req.user = user;
  next();
};
