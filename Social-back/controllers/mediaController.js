import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

export const uploadMedia = async (req, res) => {
  // This is placeholder logic expecting `req.file` to be set by multer in the route
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const { filename, mimetype, size } = req.file;
  // Basic validation already handled by multer in the route; return file meta
  return res.status(201).json({ filename, mimetype, size, url: `/uploads/${filename}` });
};
export const validateFile = (file) => {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  return allowed.includes(file.mimetype) && file.size <= maxSize;
};
