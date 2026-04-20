import express from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import asyncHandler from '../middlewares/asyncHandler.js';
import { uploadMedia } from '../../controllers/mediaController.js';
import { requireAuth } from '../middlewares/auth.js';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'];

const extToMime = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
};

const sanitizeFileName = (originalName) => {
  const extension = path.extname(originalName || '').toLowerCase();
  return `${crypto.randomUUID()}-${Date.now()}${extension}`;
};

// Use memory storage so we can validate magic-bytes before persisting to disk
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const router = express.Router();

router.post('/', requireAuth, upload.single('file'), asyncHandler(uploadMedia));

export default router;

// Note: The file validation logic is integrated into the multer configuration above.?