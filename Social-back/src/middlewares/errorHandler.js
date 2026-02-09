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

  // Fallback
  statusCode = statusCode || 500;
  res.status(statusCode);
  res.json({
    message: err.message || 'Internal Server Error',
    // expose stack only in development
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
}
