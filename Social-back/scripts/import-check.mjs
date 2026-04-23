(async () => {
  const modules = [
    'express',
    'cors',
    'helmet',
    'cookie-parser',
    '../src/routes/Users.js',
    '../src/routes/Auth.js',
    '../src/routes/Post.js',
    '../src/routes/Comment.js',
    '../src/routes/Notifications.js',
    '../src/routes/Admin.js',
    '../src/routes/Media.js',
    '../src/routes/Sessions.js',
    '../src/db.js',
    '../src/middlewares/errorHandler.js',
    '../src/middlewares/rateLimiter.js',
    '../src/middlewares/auth.js',
    '../src/config.js',
    '../src/utils/logger.js',
    'path'
  ];

  for (const m of modules) {
    try {
      console.log('importing', m);
      await import(m);
      console.log('ok', m);
    } catch (e) {
      console.error('FAILED importing', m);
      console.error(e);
      process.exit(1);
    }
  }
  console.log('all ok');
})();
