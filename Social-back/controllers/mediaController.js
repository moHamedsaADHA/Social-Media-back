import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileTypeFromBuffer } from 'file-type';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Whitelist of allowed MIME types and corresponding extensions
const ALLOWED = new Map([
  ['image/jpeg', ['jpg', 'jpeg']],
  ['image/png', ['png']],
  ['image/webp', ['webp']],
  ['video/mp4', ['mp4']],
]);

const BANNED_EXT = new Set(['js', 'html', 'htm', 'exe', 'sh', 'php', 'ps1', 'bat']);

const safeFileName = (ext) => `${crypto.randomUUID()}-${Date.now()}.${ext}`;

export const uploadMedia = async (req, res) => {
  if (!req.file || !req.file.buffer) return res.status(400).json({ error: 'No file uploaded' });

  const buffer = req.file.buffer;
  if (buffer.length === 0) return res.status(400).json({ error: 'Empty file' });

  // Detect file type from magic bytes
  const type = await fileTypeFromBuffer(buffer);
  if (!type) return res.status(400).json({ error: 'Unsupported or unrecognized file type' });

  const { mime, ext } = type;

  // Block dangerous extensions
  if (BANNED_EXT.has(ext)) return res.status(400).json({ error: 'Unsupported file type' });

  // Ensure detected mime is allowed
  if (!ALLOWED.has(mime)) return res.status(400).json({ error: 'Unsupported file type' });

  // Normalize extension to one of allowed list (prefer detected)
  const allowedExts = ALLOWED.get(mime) || [];
  const chosenExt = allowedExts.includes(ext) ? ext : allowedExts[0] || ext;

  const filename = safeFileName(chosenExt);
  const outPath = path.join(UPLOAD_DIR, filename);

  try {
    await fs.promises.writeFile(outPath, buffer, { flag: 'wx' });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to save file' });
  }

  return res.status(201).json({ filename, mimetype: mime, size: buffer.length, url: `/uploads/${filename}` });
};

export const validateFile = (file) => {
  // This helper is now limited; prefer server-side detection via magic-bytes
  if (!file) return false;
  const maxSize = 10 * 1024 * 1024; // 10MB
  return file.size <= maxSize;
};
