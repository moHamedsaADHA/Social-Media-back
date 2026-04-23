import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: ipKeyGenerator,
  message: {
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  keyGenerator: ipKeyGenerator,
  message: {
    message: 'Too many accounts created from this IP. Try again in 1 hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const passwordChangeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => `${ipKeyGenerator(req)}_${req.userId ?? 'anon'}`,
  message: {
    message: 'Too many password change attempts. Try again in 1 hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export default limiter;
