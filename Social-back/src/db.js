import mongoose from 'mongoose';
import config from './config.js';

const connectDB = async () => {
  const uri = config.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is not defined in environment');
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log('Connected to MongoDB');
};

export default connectDB;
