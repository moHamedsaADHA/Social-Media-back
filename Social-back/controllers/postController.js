import Post from '../src/models/Post.js';
import Notification from '../src/models/Notification.js';

export const createPost = async (req, res) => {
  const { image, text } = req.body;
  const userId = req.userId;

  const newPost = new Post({ userId, image, text });
  await newPost.save();
  return res.status(201).json(newPost);
};

export const likePost = async (req, res) => {
  const userId = req.userId;
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
  const updateData = { ...req.body };
  delete updateData.userId;
  delete updateData.isAdmin;

  const post = req.resource;
  post.set(updateData);
  const updated = await post.save();
  return res.status(200).json(updated);
};

export const deletePost = async (req, res) => {
  await req.resource.deleteOne();
  return res.status(200).json({ message: 'Post deleted successfully' });
};
