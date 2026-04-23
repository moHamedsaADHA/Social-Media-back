import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import config from '../src/config.js';
import User from '../src/models/User.js';
import Post from '../src/models/Post.js';
import Comment from '../src/models/Comment.js';
import Notification from '../src/models/Notification.js';
import Session from '../src/models/Session.js';
import generateToken from '../src/utils/generateToken.js';
import { cache } from '../src/utils/cache.js';
import { ensureNotLastAdmin } from '../src/utils/adminGuard.js';

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

export const registerUser = async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: 'Missing fields' });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ success: false, message: 'User already exists' });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ username, email, password: hashed });
  const token = await generateToken(user._id, res, req);

  return res.status(201).json({
    success: true,
    token,
    user: { id: user._id, username: user.username, email: user.email },
  });
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) return res.status(400).json({ error: 'Invalid email or password' });

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return res.status(401).json({ error: 'Invalid email or password' });

  const token = await generateToken(user._id, res, req);
  return res.status(200).json({
    message: 'Login successful',
    token,
    user: { id: user._id, username: user.username, email: user.email },
  });
};

export const getUserById = async (req, res) => {
  const cacheKey = `users:profile:${req.params.id}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return res.status(200).json(cached);
  }

  const user = await User.findById(req.params.id).select('-password');
  if (!user) return res.status(404).json({ error: 'User not found' });

  cache.set(cacheKey, user, 600);
  return res.status(200).json(user);
};

export const getMyProfile = async (req, res) => {
  const user = await User.findById(req.userId).select('-password');
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.status(200).json(user);
};

export const updateUser = async (req, res) => {
  const forbiddenFields = ['isAdmin', 'followers', 'following', 'likes', 'commentsCount', 'role', 'password', 'userId'];
  const hasForbiddenFields = forbiddenFields.some((field) => Object.prototype.hasOwnProperty.call(req.body, field));
  if (hasForbiddenFields) {
    return res.status(400).json({ error: 'Attempt to update restricted fields' });
  }

  const user = req.resource;
  const { name, bio, avatar, location } = req.body;

  if (name !== undefined) user.name = name;
  if (bio !== undefined) user.bio = bio;
  if (avatar !== undefined) user.avatar = avatar;
  if (location !== undefined) user.location = location;

  const updated = await user.save();
  cache.del(`users:profile:${updated._id.toString()}`);
  return res.status(200).json(updated);
};

export const logoutUser = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  // If refresh token cookie exists, revoke that session by token hash
  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await Session.findOneAndUpdate(
      { tokenHash, isRevoked: false },
      { $set: { isRevoked: true } },
    );
  }

  // Also support Authorization: Bearer <accessToken> logout
  const authHeader = req.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const payload = jwt.verify(token, config.JWT_SECRET);
      const sid = payload?.sid;
      if (sid) {
        await Session.findByIdAndUpdate(sid, { $set: { isRevoked: true } });
      }
    } catch (e) {
      // if verification fails, we still proceed to clear cookie — best-effort logout
    }
  }

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  return res.status(200).json({ message: 'Logged out successfully' });
};

export const deleteUser = async (req, res) => {
  try {
    await ensureNotLastAdmin(req.resource._id);
  } catch (error) {
    if (error.message === 'LAST_ADMIN') {
      return res.status(403).json({
        message: 'Cannot delete the last admin account. Promote another user to admin first.',
      });
    }
    throw error;
  }

  const userId = req.resource._id;
  await req.resource.deleteOne();
  await Promise.all([
    Post.deleteMany({ userId }),
    Comment.deleteMany({ userId }),
    Notification.deleteMany({ $or: [{ actor: userId }, { recipient: userId }] }),
    Session.deleteMany({ userId }),
  ]);
  cache.del(`users:profile:${userId.toString()}`);
  return res.status(200).json({ message: 'User deleted successfully' });
};

export const followUser = async (req, res) => {
  const { id } = req.params; // target user id
  const userId = req.userId; // follower id
  if (id === userId) {
    return res.status(400).json({ message: 'You cannot follow yourself' });
  }

  const target = await User.findById(id);
  const actor = await User.findById(userId);
  if (!target || !actor) return res.status(404).json({ error: 'User not found' });

  const already = target.followers.find((u) => u.toString() === userId);
  if (already) {
    // unfollow
    target.followers = target.followers.filter((u) => u.toString() !== userId);
    actor.following = actor.following.filter((u) => u.toString() !== id);
  } else {
    target.followers.push(userId);
    actor.following.push(id);
    // create notification for follow
    // Do not create if user follows themselves
    import('../src/models/Notification.js').then(({ default: Notification }) => {
      Notification.create({ type: 'follow', actor: userId, recipient: id }).catch(() => {});
    }).catch(()=>{});
  }

  await target.save();
  await actor.save();
  return res.status(200).json({ target, actor });
};
