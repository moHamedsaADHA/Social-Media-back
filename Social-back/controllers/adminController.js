import User from '../src/models/User.js';
import Post from '../src/models/Post.js';


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
  const deleted = await User.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ error: 'User not found' });
  return res.status(200).json({ message: 'User deleted' });
};

export const deletePostAdmin = async (req, res) => {
  const { id } = req.params;
  const deleted = await Post.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ error: 'Post not found' });
  return res.status(200).json({ message: 'Post deleted' });
};

export const viewStats = async (req, res) => {
  const users = await User.countDocuments();
  const posts = await Post.countDocuments();
  return res.status(200).json({ users, posts });
};
