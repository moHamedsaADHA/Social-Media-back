import User from '../models/User.js';

export async function ensureNotLastAdmin(userId) {
  const [adminCount, targetUser] = await Promise.all([
    User.countDocuments({ isAdmin: true }),
    User.findById(userId).select('isAdmin'),
  ]);

  if (!targetUser) {
    return;
  }

  if (targetUser.isAdmin && adminCount <= 1) {
    throw new Error('LAST_ADMIN');
  }
}

export default { ensureNotLastAdmin };
/**
 * وجود adminGuard وauthorize middleware
 فصل جيد بين التحقق من التوكن والصلاحيات.
 ولمعرفه عدد الادمنز ومنع اخر ادمن من حذف حسابه
 */