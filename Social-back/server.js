import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import usersRouter from './src/routes/users.js';
import postsRouter from './src/routes/Post.js';
import commentsRouter from './src/routes/Comment.js';
import notificationsRouter from './src/routes/Notifications.js';
import adminRouter from './src/routes/Admin.js';
import mediaRouter from './src/routes/Media.js';
import connectDB from './src/db.js';
import errorHandler from './src/middlewares/errorHandler.js';
import rateLimiter from './src/middlewares/rateLimiter.js';
import { cacheMiddleware } from './src/utils/cache.js';
import { optionalAuth } from './src/middlewares/auth.js';
import config from './src/config.js';
import path from 'path';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Rate limiting
app.use(rateLimiter);

// Connect to DB (best-effort on import)
connectDB().catch((err) => console.error('DB connection error:', err));

// Optional auth: update lastActiveAt for requests with a valid token
app.use(optionalAuth);

// Route registration - caching is applied per-route (GET handlers)
app.use('/api/users', usersRouter);
app.use('/api/posts', postsRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/media', mediaRouter);

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Centralized error handler
app.use(errorHandler);

// Start server
const PORT = config.PORT || 5000;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});

export default app;

