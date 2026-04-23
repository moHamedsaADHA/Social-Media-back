import crypto from 'crypto';
import Session from '../src/models/Session.js';

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

export const getMySessions = async (req, res) => {
  const now = new Date();
  const sessions = await Session.find({
    userId: req.userId,
    isRevoked: false,
    expiresAt: { $gt: now },
  }).select('_id deviceInfo ipAddress createdAt expiresAt');

  const data = sessions.map((session) => ({
    id: session._id,
    deviceInfo: session.deviceInfo,
    ipAddress: session.ipAddress,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
  }));

  return res.status(200).json(data);
};

export const revokeSession = async (req, res) => {
  const { id } = req.params;
  const session = await Session.findById(id);
  if (!session) {
    return res.status(404).json({ message: 'Session not found' });
  }

  if (session.userId.toString() !== req.userId) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  session.isRevoked = true;
  await session.save();

  return res.status(200).json({ message: 'Session revoked successfully' });
};

export const revokeAllSessions = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token is required' });
  }

  const tokenHash = hashToken(refreshToken);
  const currentSession = await Session.findOne({
    userId: req.userId,
    tokenHash,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  }).select('_id');

  if (!currentSession) {
    return res.status(401).json({ message: 'Session expired, please login again' });
  }

  await Session.updateMany(
    { userId: req.userId, _id: { $ne: currentSession._id } },
    { $set: { isRevoked: true } },
  );

  return res.status(200).json({ message: 'All other sessions revoked successfully' });
};

export default { getMySessions, revokeSession, revokeAllSessions };