import '../scripts/ensureEnv.js';
import 'dotenv/config';
import mongoose from 'mongoose';
import config from './config.js';
import logger from './utils/logger.js';

const isTestEnv = process.env.NODE_ENV === 'test' || Boolean(process.env.JEST_WORKER_ID);

let _connected = false;

const tryConnect = async (uri) => {
  try {
    if (!uri) return { success: false, error: 'No URI provided' };

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      _connected = true;
      logger.info('MongoDB already connected (existing connection).');
      return { success: true };
    }

    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    _connected = true;
    logger.info(`Connected to MongoDB: ${uri}`);
    return { success: true };
  } catch (err) {
    const msg = err?.message || String(err);
    logger.warn(`MongoDB connection attempt failed for ${uri}: ${msg}`);
    return { success: false, error: msg };
  }
};

export async function connectDB() {
  if (isTestEnv) {
    logger.info('Test environment detected; skipping MongoDB connection.');
    return false;
  }

  if (_connected || (mongoose.connection && mongoose.connection.readyState === 1)) {
    _connected = true;
    logger.info('MongoDB connection already established.');
    return true;
  }

  const primary = config.MONGO_URI;
  const fallback = 'mongodb://127.0.0.1:27017/social-app';
  const attempts = [];

  const first = await tryConnect(primary);
  if (first.success) return true;
  attempts.push({ uri: primary, error: first.error });

  if (primary !== fallback) {
    logger.info('Attempting fallback MongoDB URI...');
    const second = await tryConnect(fallback);
    if (second.success) return true;
    attempts.push({ uri: fallback, error: second.error });
  }

  const errors = attempts.map(t => `${t.uri} -> ${t.error}`).join('; ');
  logger.error(`Startup: MongoDB connection failed: ${errors}`);

  if (process.env.NODE_ENV === 'production') {
    logger.error('Startup: MongoDB connection failed and NODE_ENV=production — exiting.');
    // Terminate process explicitly in production to avoid running without DB
    process.exit(1);
  }

  logger.warn('Startup: MongoDB not connected; continuing in development mode (some routes may fail).');
  return false;
}

export function isDbConnected() {
  return _connected || (mongoose.connection && mongoose.connection.readyState === 1);
}

export default connectDB;
