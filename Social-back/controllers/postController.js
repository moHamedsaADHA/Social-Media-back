import Post from '../src/models/Post.js';
import Notification from '../src/models/Notification.js';

export const createPost = async (req, res) => {
  const { userId, image, text } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const newPost = new Post({ userId, image, text });
  await newPost.save();
  return res.status(201).json(newPost);
};

export const likePost = async (req, res) => {
  const { userId } = req.body;
  const { id } = req.params;
  const post = await Post.findById(id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const already = post.likes.find((u) => u.toString() === userId);
  if (already) {
    // unlike
    post.likes = post.likes.filter((u) => u.toString() !== userId);
  } else {
    post.likes.push(userId);
    // create notification for post owner (if liker is not the owner)
    if (post.userId.toString() !== userId) {
      await Notification.create({
        type: 'like',
        actor: userId,
        recipient: post.userId,
        post: post._id,
      });
    }
  }

  await post.save();
  return res.status(200).json(post);
};

export const getPosts = async (req, res) => {
  const posts = await Post.find().sort({ createdAt: -1 });
  return res.status(200).json(posts);
};

export const getPostById = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  return res.status(200).json(post);
};

export const updatePost = async (req, res) => {
  const updated = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!updated) return res.status(404).json({ error: 'Post not found' });
  return res.status(200).json(updated);
};

export const deletePost = async (req, res) => {
  const deleted = await Post.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Post not found' });
  return res.status(200).json({ message: 'Post deleted successfully' });
};
