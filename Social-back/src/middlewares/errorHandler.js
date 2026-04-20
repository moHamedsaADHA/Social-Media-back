import logger from '../utils/logger.js';

export default function errorHandler(err, req, res, next) {
  // Default to 500 unless a more specific status was set
  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    return res.status(statusCode).json({ message: 'Invalid ID format' });
  }

  // Mongoose validation errors or express-validator
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors || {}).map((e) => e.message || e);
    return res.status(statusCode).json({ message: 'Validation error', errors });
  }

  // Mongo duplicate key error (11000)
  if (err.code && err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {}).join(', ');
    const message = field ? `${field} already exists` : 'Duplicate key error';
    return res.status(statusCode).json({ message });
  }

  // Log full error detail internally
  try {
    logger.error(JSON.stringify({
      message: err.message,
      stack: err.stack,
      path: req.originalUrl,
      method: req.method,
      body: req.body ? '[REDACTED]' : undefined,
    }));
  } catch (e) {
    // best-effort logging
    console.error('Error while logging error:', e);
  }

  // Fallback - never leak internals in production
  statusCode = statusCode || 500;
  res.status(statusCode);
  if (process.env.NODE_ENV === 'production') {
    return res.json({ message: 'Internal Server Error' });
  }

  // In non-production expose message/stack to help debugging
  return res.json({ message: err.message || 'Internal Server Error', stack: err.stack });
}
