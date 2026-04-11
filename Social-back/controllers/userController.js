import bcrypt from 'bcryptjs';
import User from '../src/models/User.js';
import generateToken from '../src/utils/generateToken.js';

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
  const token = generateToken(user._id);

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

  const token = generateToken(user._id);
  return res.status(200).json({
    message: 'Login successful',
    token,
    user: { id: user._id, username: user.username, email: user.email },
  });
};

export const getUserById = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.status(200).json(user);
};

export const getMyProfile = async (req, res) => {
  // Placeholder behavior: attempts to read `req.params.id` like original routes.
  const user = await User.findById(req.params.id).select('+password');
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.status(200).json(user);
};

export const updateUser = async (req, res) => {
  const updateData = { ...req.body };
  delete updateData.userId;
  delete updateData.isAdmin;

  const user = req.resource;
  user.set(updateData);
  const updated = await user.save();
  return res.status(200).json(updated);
};

export const logoutUser = async (req, res) => {
  // Stateless logout: client should remove token. Kept for parity with existing routes.
  return res.status(200).json({ message: 'Logout successful' });
};

export const deleteUser = async (req, res) => {
  await req.resource.deleteOne();
  return res.status(200).json({ message: 'User deleted successfully' });
};

export const followUser = async (req, res) => {
  const { id } = req.params; // target user id
  const userId = req.userId; // follower id

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
