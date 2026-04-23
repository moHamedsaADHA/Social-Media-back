import mongoose from 'mongoose';
import config from './config.js';
import logger from './utils/logger.js';

const isTestEnv = process.env.NODE_ENV === 'test' || Boolean(process.env.JEST_WORKER_ID);

let _connected = false;

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

  const uri = config.MONGO_URI;
  if (!uri) {
    logger.error('Startup: MONGO_URI is not set. Exiting to avoid unintended database connections.');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    _connected = true;
    logger.info(`Connected to MongoDB: ${uri}`);
    return true;
  } catch (err) {
    const msg = err?.message || String(err);
    logger.error(`Startup: MongoDB connection failed for ${uri}: ${msg}`);
    logger.error('Startup: Exiting due to MongoDB connection failure.');
    process.exit(1);
  }
}

export function isDbConnected() {
  return _connected || (mongoose.connection && mongoose.connection.readyState === 1);
}

export default connectDB;
