const config = {
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/social-app',
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || 'change_this_secret',
};

export default config;
