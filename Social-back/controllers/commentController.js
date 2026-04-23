import Comment from '../src/models/Comment.js';
import Notification from '../src/models/Notification.js';
import Post from '../src/models/Post.js';
// ده بيتطبق فقط على دالة getCommentsByPost，
//  يعني لما تطلب تجيب الكومنتات اللي على بوست معين:
// الـ API هيرجّعلك 10 كومنتات في كل صفحة افتراضيًا.

const getPagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 50);
  return { page, limit, skip: (page - 1) * limit };
};

export const createComment = async (req, res) => {
  const { postId, text } = req.body;
  const userId = req.userId;
  if (!postId || !text) return res.status(400).json({ error: 'Missing fields' });

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
  const { page, limit, skip } = getPagination(req.query);
  const filter = { postId: req.params.postId };
  const [totalCount, comments] = await Promise.all([
    Comment.countDocuments(filter),
    Comment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
  ]);

  return res.status(200).json({
    data: comments,
    page,
    totalPages: Math.ceil(totalCount / limit) || 1,
    totalCount,
  });
};

export const getCommentById = async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) return res.status(404).json({ error: 'Comment not found' });
  return res.status(200).json(comment);
};

export const updateComment = async (req, res) => {
  const forbiddenFields = ['isAdmin', 'followers', 'following', 'likes', 'commentsCount', 'role', 'password', 'userId'];
  const hasForbiddenFields = forbiddenFields.some((field) => Object.prototype.hasOwnProperty.call(req.body, field));
  if (hasForbiddenFields) {
    return res.status(400).json({ error: 'Attempt to update restricted fields' });
  }

  const comment = req.resource;
  const { text } = req.body;
  if (text !== undefined) {
    comment.text = text;
  }

  const updated = await comment.save();
  return res.status(200).json(updated);
};

export const deleteComment = async (req, res) => {
  await req.resource.deleteOne();
  // decrement commentsCount on the related post (best-effort)
  try {
    await Post.findByIdAndUpdate(req.resource.postId, { $inc: { commentsCount: -1 } });
  } catch (err) {
    // ignore
  }
  return res.status(200).json({ message: 'Comment deleted successfully' });
};
