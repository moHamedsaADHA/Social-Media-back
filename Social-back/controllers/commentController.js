import Comment from '../src/models/comment.js';
import Notification from '../src/models/Notification.js';
import Post from '../src/models/Post.js';

export const createComment = async (req, res) => {
  const { userId, postId, text } = req.body;
  if (!userId || !postId || !text) return res.status(400).json({ error: 'Missing fields' });

  const comment = await Comment.create({ userId, postId, text });
  // increment commentsCount on the post (atomic)
  try {
    await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });
  } catch (err) {
    // best-effort: ignore failures here so comment creation still succeeds
  }
  // create notification for post owner (best-effort)
  try {
    const post = await Post.findById(postId);
    if (post && post.userId.toString() !== userId) {
      await Notification.create({ type: 'comment', actor: userId, recipient: post.userId, comment: comment._id, post: postId });
    }
  } catch (err) {
    // ignore notification errors
  }
  return res.status(201).json(comment);
};

export const getCommentsByPost = async (req, res) => {
  const comments = await Comment.find({ postId: req.params.postId }).sort({ createdAt: -1 });
  return res.status(200).json(comments);
};

export const getCommentById = async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) return res.status(404).json({ error: 'Comment not found' });
  return res.status(200).json(comment);
};

export const updateComment = async (req, res) => {
  const updated = await Comment.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!updated) return res.status(404).json({ error: 'Comment not found' });
  return res.status(200).json(updated);
};

export const deleteComment = async (req, res) => {
  const deleted = await Comment.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Comment not found' });
  // decrement commentsCount on the related post (best-effort)
  try {
    await Post.findByIdAndUpdate(deleted.postId, { $inc: { commentsCount: -1 } });
  } catch (err) {
    // ignore
  }
  return res.status(200).json({ message: 'Comment deleted successfully' });
};
