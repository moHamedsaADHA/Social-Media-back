const config = {
  MONGO_URI: process.env.MONGO_URI || null,
  PORT: process.env.PORT ? Number(process.env.PORT) : 5000,
  JWT_SECRET: process.env.JWT_SECRET,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [],
};

// STRICT: JWT_SECRET must be present and not a placeholder in non-test environments
if (process.env.NODE_ENV !== 'test') {
  const val = config.JWT_SECRET;
  const isPlaceholder = typeof val === 'string' && (val === 'replace_with_a_long_random_secret' || val.trim() === '');
  const tooShort = typeof val === 'string' && val.length < 32;
  if (!val || isPlaceholder || tooShort) {
    console.error('[FATAL] JWT_SECRET is missing or insecure. Set a strong JWT_SECRET in the environment.');
    // Exit immediately with failure to enforce security policy
    process.exit(1);
  }
}

export default config;
