import express from 'express';
import multer from 'multer';
import path from 'path';
import asyncHandler from '../middlewares/asyncHandler.js';
import { uploadMedia, validateFile } from '../../controllers/mediaController.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(process.cwd(), 'uploads')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
    if (!allowed.includes(file.mimetype)) return cb(new Error('Unsupported file type'), false);
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = express.Router();

router.post('/', upload.single('file'), asyncHandler(uploadMedia));

export default router;

// Note: The file validation logic is integrated into the multer configuration above.?