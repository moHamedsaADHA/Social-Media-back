import User from '../models/User.js';

/**
 * Return users active within the last `minutes` minutes.
 * @param {number} minutes
 */
export const getActiveUsers = async (minutes = 60) => {
  const since = new Date(Date.now() - minutes * 60 * 1000);
  return User.find({ lastActiveAt: { $gte: since } }).select('-password');
};

export default { getActiveUsers };
