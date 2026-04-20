import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../config.js';
import Session from '../models/Session.js';
import User from '../models/User.js';
import { issueAccessToken } from '../utils/generateToken.js';

const FIVE_MINUTES_MS = 5 * 60 * 1000;

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const maybeUpdateLastActive = async (userId) => {
  const threshold = new Date(Date.now() - FIVE_MINUTES_MS);
  await User.findOneAndUpdate(
    {
      _id: userId,
      $or: [
        { lastActiveAt: { $lt: threshold } },
        { lastActiveAt: { $exists: false } },
      ],
    },
    { $set: { lastActiveAt: new Date(), isActive: true } },
  );
};

const getRefreshTokenFromCookie = (req) => req.cookies?.refreshToken;

const validateSessionFromRefreshToken = async (refreshToken) => {
  if (!refreshToken) return null;

  const tokenHash = hashToken(refreshToken);
  return Session.findOne({
    tokenHash,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  });
};

const validateSessionById = async (sid) => {
  if (!sid) return null;
  const session = await Session.findById(sid);
  if (!session) return null;
  if (session.isRevoked) return null;
  if (!session.expiresAt || session.expiresAt <= new Date()) return null;
  return session;
};

const hydrateRequestUser = async (req, userId, sessionId) => {
  req.userId = userId.toString();
  req.sessionId = sessionId ? sessionId.toString() : null;

  const user = await User.findById(userId).select('isAdmin');
  req.userIsAdmin = user?.isAdmin || false;
  await maybeUpdateLastActive(userId);
};

const getAccessTokenFromHeader = (req) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.split(' ')[1];
};

// Optional auth middleware - attach user if token+session valid; do not accept token without session
export const optionalAuth = async (req, res, next) => {
  const token = getAccessTokenFromHeader(req);
  if (!token) return next();

  try {
    const payload = jwt.verify(token, config.JWT_SECRET);
    const { id: userId, sid } = payload || {};
    if (!userId || !sid) return next();
    const session = await validateSessionById(sid);
    if (!session) return next();
    await hydrateRequestUser(req, userId, session._id);
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      const refreshToken = getRefreshTokenFromCookie(req);
      const session = await validateSessionFromRefreshToken(refreshToken);
      if (session) {
        const newAccessToken = issueAccessToken(session.userId.toString(), session._id.toString());
        res.setHeader('x-access-token', newAccessToken);
        await hydrateRequestUser(req, session.userId, session._id);
      }
    }
    return next();
  }
};

// Require auth middleware - returns 401 if missing/invalid; enforces session lookup for every request
export const requireAuth = async (req, res, next) => {
  const token = getAccessTokenFromHeader(req);
  const refreshToken = getRefreshTokenFromCookie(req);

  if (!token && !refreshToken) return res.status(401).json({ error: 'Unauthorized' });

  if (token) {
    try {
      const payload = jwt.verify(token, config.JWT_SECRET);
      const { id: userId, sid } = payload || {};
      if (!userId || !sid) return res.status(401).json({ error: 'Unauthorized' });

      const session = await validateSessionById(sid);
      if (!session) return res.status(401).json({ message: 'Session expired, please login again' });

      await hydrateRequestUser(req, userId, session._id);
      return next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        if (!refreshToken) return res.status(401).json({ message: 'Session expired, please login again' });
        const session = await validateSessionFromRefreshToken(refreshToken);
        if (!session) return res.status(401).json({ message: 'Session expired, please login again' });

        const newAccessToken = issueAccessToken(session.userId.toString(), session._id.toString());
        res.setHeader('x-access-token', newAccessToken);
        await hydrateRequestUser(req, session.userId, session._id);
        return next();
      }
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  // No access token but refresh cookie present
  const session = await validateSessionFromRefreshToken(refreshToken);
  if (!session) return res.status(401).json({ message: 'Session expired, please login again' });

  const newAccessToken = issueAccessToken(session.userId.toString(), session._id.toString());
  res.setHeader('x-access-token', newAccessToken);
  await hydrateRequestUser(req, session.userId, session._id);
  return next();
};

export default { optionalAuth, requireAuth };
