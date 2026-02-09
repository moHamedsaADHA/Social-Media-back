import Notification from '../src/models/Notification.js';

export const getNotificationsForUser = async (req, res) => {
  const { userId } = req.params;
  const notifications = await Notification.find({ recipient: userId }).sort({ createdAt: -1 });
  return res.status(200).json(notifications);
};

export const markNotificationRead = async (req, res) => {
  const { id } = req.params;
  const updated = await Notification.findByIdAndUpdate(id, { read: true }, { new: true });
  if (!updated) return res.status(404).json({ error: 'Notification not found' });
  return res.status(200).json(updated);
};

export const deleteNotification = async (req, res) => {
  const { id } = req.params;
  const deleted = await Notification.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ error: 'Notification not found' });
  return res.status(200).json({ message: 'Deleted' });
};
