import Post from '../src/models/Post.js';
import Comment from '../src/models/Comment.js';
import Notification from '../src/models/Notification.js';
import fs from 'fs/promises';
import path from 'path';
import { cache } from '../src/utils/cache.js';

const getPagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 50);
  return { page, limit, skip: (page - 1) * limit };
};

const removeUploadedFile = async (imagePath) => {
  if (!imagePath || typeof imagePath !== 'string') return;
  const baseName = path.basename(imagePath);
  const absolutePath = path.join(process.cwd(), 'uploads', baseName);
  try {
    await fs.unlink(absolutePath);
  } catch (error) {
    // best-effort cleanup
  }
};

export const createPost = async (req, res) => {
  const { image, text } = req.body;
  const userId = req.userId;

  const newPost = new Post({ userId, image, text });
  await newPost.save();
  cache.delByPrefix('posts:feed');
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
  cache.delByPrefix('posts:feed');
  cache.del(`posts:id:${post._id.toString()}`);
  return res.status(200).json(post);
};

export const getPosts = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const cacheKey = `posts:feed:page:${page}:limit:${limit}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return res.status(200).json(cached);
  }

  const [totalCount, posts] = await Promise.all([
    Post.countDocuments(),
    Post.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
  ]);

  const response = {
    data: posts,
    page,
    totalPages: Math.ceil(totalCount / limit) || 1,
    totalCount,
  };

  cache.set(cacheKey, response, 120);
  return res.status(200).json(response);
};

export const getPostById = async (req, res) => {
  const postId = req.params.id;
  const cacheKey = `posts:id:${postId}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return res.status(200).json(cached);
  }

  const post = await Post.findById(postId);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  cache.set(cacheKey, post, 300);
  return res.status(200).json(post);
};

export const updatePost = async (req, res) => {
  const forbiddenFields = ['isAdmin', 'followers', 'following', 'likes', 'commentsCount', 'role', 'password', 'userId'];
  const hasForbiddenFields = forbiddenFields.some((field) => Object.prototype.hasOwnProperty.call(req.body, field));
  if (hasForbiddenFields) {
    return res.status(400).json({ error: 'Attempt to update restricted fields' });
  }

  const post = req.resource;
  const { content, image, visibility } = req.body;

  if (content !== undefined) {
    post.text = content;
  }
  if (image !== undefined) {
    post.image = image;
  }
  if (visibility !== undefined) {
    post.visibility = visibility;
  }

  const updated = await post.save();
  cache.delByPrefix('posts:feed');
  cache.del(`posts:id:${post._id.toString()}`);
  return res.status(200).json(updated);
};

export const deletePost = async (req, res) => {
  const post = req.resource;
  const postId = post._id;
  const imagePath = post.image;

  await post.deleteOne();
  await Promise.all([
    Comment.deleteMany({ $or: [{ postId }, { post: postId }] }),
    Notification.deleteMany({ post: postId }),
  ]);
  await removeUploadedFile(imagePath);
  cache.delByPrefix('posts:feed');
  cache.del(`posts:id:${postId.toString()}`);

  return res.status(200).json({ message: 'Post deleted successfully' });
};
