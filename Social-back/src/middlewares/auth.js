import jwt from 'jsonwebtoken';
import config from '../config.js';
import User from '../models/User.js';

// Optional auth middleware - if Authorization header present and valid,
// attach `req.userId` and `req.userIsAdmin` and update `lastActiveAt`.
export const optionalAuth = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return next();

  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, config.JWT_SECRET);
    if (payload && payload.id) {
      req.userId = payload.id;
      // fetch user role and update lastActiveAt
      try {
        const user = await User.findByIdAndUpdate(payload.id, { $set: { lastActiveAt: new Date(), isActive: true } }, { new: true });
        req.userIsAdmin = user?.isAdmin || false;
      } catch (e) {
        // don't block request on DB update failure
        req.userIsAdmin = false;
      }
    }
  } catch (err) {
    // invalid token - ignore and continue as unauthenticated
  }
  return next();
};

// Require auth middleware - returns 401 if missing/invalid
export const requireAuth = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, config.JWT_SECRET);
    if (!payload || !payload.id) return res.status(401).json({ error: 'Unauthorized' });
    req.userId = payload.id;
    try {
      const user = await User.findByIdAndUpdate(payload.id, { $set: { lastActiveAt: new Date(), isActive: true } }, { new: true });
      req.userIsAdmin = user?.isAdmin || false;
    } catch (e) {
      req.userIsAdmin = false;
    }
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

export default { optionalAuth, requireAuth };
