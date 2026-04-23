import bcrypt from 'bcryptjs';
import Session from '../src/models/Session.js';
import User from '../src/models/User.js';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return res.status(400).json({ message: 'All password fields are required' });
  }

  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({ message: 'New passwords do not match' });
  }

  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({
      message: 'New password must include uppercase, lowercase, number, and special character',
    });
  }

  if (newPassword === currentPassword) {
    return res.status(400).json({ message: 'New password must be different from current password' });
  }

  const user = await User.findById(req.userId).select('+password');
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
  if (!isCurrentValid) {
    return res.status(400).json({ message: 'Current password is incorrect' });
  }

  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();

  await Session.updateMany(
    { userId: req.userId, _id: { $ne: req.sessionId } },
    { $set: { isRevoked: true } },
  );

  return res.status(200).json({ message: 'Password changed successfully' });
};

export default { changePassword };