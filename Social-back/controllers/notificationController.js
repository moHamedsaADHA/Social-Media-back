import Notification from '../src/models/Notification.js';

const getPagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 50);
  return { page, limit, skip: (page - 1) * limit };
};

export const getNotificationsForUser = async (req, res) => {
  const { userId } = req.params;
  if (userId !== req.userId) return res.status(403).json({ error: 'Forbidden' });

  const { page, limit, skip } = getPagination(req.query);
  const filter = { recipient: req.userId };
  const [totalCount, notifications] = await Promise.all([
    Notification.countDocuments(filter),
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
  ]);

  return res.status(200).json({
    data: notifications,
    page,
    totalPages: Math.ceil(totalCount / limit) || 1,
    totalCount,
  });
};

export const markNotificationRead = async (req, res) => {
  const { id } = req.params;
  const notification = await Notification.findById(id);
  if (!notification) return res.status(404).json({ error: 'Notification not found' });
  if (notification.recipient.toString() !== req.userId) return res.status(403).json({ error: 'Forbidden' });

  notification.read = true;
  const updated = await notification.save();
  return res.status(200).json(updated);
};

export const deleteNotification = async (req, res) => {
  const { id } = req.params;
  const notification = await Notification.findById(id);
  if (!notification) return res.status(404).json({ error: 'Notification not found' });
  if (notification.recipient.toString() !== req.userId) return res.status(403).json({ error: 'Forbidden' });

  await notification.deleteOne();
  return res.status(200).json({ message: 'Deleted' });
};
