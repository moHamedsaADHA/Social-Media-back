import User from '../src/models/User.js';
import Post from '../src/models/Post.js';
import Comment from '../src/models/Comment.js';
import Notification from '../src/models/Notification.js';
import Session from '../src/models/Session.js';
import { ensureNotLastAdmin } from '../src/utils/adminGuard.js';


// TODO: protect with admin authentication middleware
export const getAllUsersAdmin = async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  return res.status(200).json(users);
};
export const deleteUserAdmin = async (req, res) => {
  const { id } = req.params;
  // Prevent admin from deleting himself
  const requesterId = req.userId;
  const requesterIsAdmin = req.userIsAdmin;
  // If the requester is an admin and is trying to delete their own account, forbid it
  if (requesterIsAdmin && requesterId && requesterId.toString() === id.toString()) {
    return res.status(403).json({ error: 'Admin cannot delete his own account' });
  }

  try {
    await ensureNotLastAdmin(id);
  } catch (error) {
    if (error.message === 'LAST_ADMIN') {
      return res.status(403).json({
        message: 'Cannot delete the last admin account. Promote another user to admin first.',
      });
    }
    throw error;
  }

  const deleted = await User.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ error: 'User not found' });

  await Promise.all([
    Post.deleteMany({ userId: id }),
    Comment.deleteMany({ userId: id }),
    Notification.deleteMany({ $or: [{ actor: id }, { recipient: id }] }),
    Session.deleteMany({ userId: id }),
  ]);

  return res.status(200).json({ message: 'User deleted' });
};

export const deletePostAdmin = async (req, res) => {
  const { id } = req.params;
  const deleted = await Post.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ error: 'Post not found' });

  await Promise.all([
    Comment.deleteMany({ $or: [{ postId: id }, { post: id }] }),
    Notification.deleteMany({ post: id }),
  ]);

  return res.status(200).json({ message: 'Post deleted' });
};

export const viewStats = async (req, res) => {
  const users = await User.countDocuments();
  const posts = await Post.countDocuments();
  return res.status(200).json({ users, posts });
};

export const demoteAdmin = async (req, res) => {
  const { id } = req.params;

  try {
    await ensureNotLastAdmin(id);
  } catch (error) {
    if (error.message === 'LAST_ADMIN') {
      return res.status(403).json({
        message: 'Cannot delete the last admin account. Promote another user to admin first.',
      });
    }
    throw error;
  }

  const user = await User.findByIdAndUpdate(id, { $set: { isAdmin: false } }, { new: true }).select('-password');
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  return res.status(200).json({ message: 'Admin role removed successfully', user });
};
