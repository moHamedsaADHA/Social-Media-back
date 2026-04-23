const config = {
  MONGO_URI: process.env.MONGO_URI,
  PORT: process.env.PORT ? Number(process.env.PORT) : 5000,
  JWT_SECRET: process.env.JWT_SECRET,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [],
};

// Enforce required environment variables in non-test environments
if (process.env.NODE_ENV !== 'test') {
  const missing = [];
  if (!config.JWT_SECRET) missing.push('JWT_SECRET');
  if (!config.MONGO_URI) missing.push('MONGO_URI');

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

export default config;
