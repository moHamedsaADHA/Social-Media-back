import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Session from '../models/Session.js';
import config from '../config.js';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

/**
 * Issue an access token bound to a session id (sid)
 */
export const issueAccessToken = (userId, sessionId) => {
  return jwt.sign({ id: userId, sid: sessionId }, config.JWT_SECRET, { expiresIn: '15m' });
};

/**
 * Generate refresh token (JWT), create session record, and return access token
 * Access token is bound to the created session id so revocation works immediately.
 */
const generateToken = async (userId, res, req) => {
  // Create a refresh token (JWT) first
  const refreshToken = jwt.sign({ id: userId }, config.JWT_SECRET, { expiresIn: '30d' });

  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + THIRTY_DAYS_MS);

  // Create session record tied to this refresh token hash
  const session = await Session.create({
    userId,
    tokenHash,
    deviceInfo: req.headers['user-agent'] || 'Unknown',
    ipAddress: req.ip,
    expiresAt,
  });

  // Issue access token that includes session id
  const accessToken = issueAccessToken(userId, session._id.toString());

  // Set refresh cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: THIRTY_DAYS_MS,
  });

  return accessToken;
};

export default generateToken;


/*
 الـ ريفريش توكن بيتخزن مشفر (هاشد) في جدول السيشن في الداتابيز.
كل جهاز/متصفح بياخد سيشن منفصل (ديفايس إنفو + اي بي).
تقدر تسجل خروج من جهاز معين عن طريق حذف الـ سيشن من الداتابيز (ده شكل أمان عالي).
ف لازم في الفرونت اعمل زي لعبه ببجي وهيكون فيه مكان فيه كل اسماء الاجهزه والارقامهم 
ولو امكن اماكنهم عشان نعرف مين اللي عامل لوجين ولامان اعلي  
*/