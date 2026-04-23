import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const envPath = path.join(process.cwd(), '.env');
const examplePath = path.join(process.cwd(), '.env.example');

const DEFAULTS = {
  MONGO_URI: 'mongodb://127.0.0.1:27017/social-app',
  PORT: '5000',
  ALLOWED_ORIGINS: 'http://localhost:3000,http://127.0.0.1:3000',
  NODE_ENV: 'development',
  LOG_LEVEL: 'info',
};

function generateSecret() {
  return crypto.randomBytes(48).toString('hex');
}

function parseEnv(content) {
  return (content || '').split(/\r?\n/).reduce((acc, line) => {
    if (!line || line.trim().startsWith('#')) return acc;
    const idx = line.indexOf('=');
    if (idx === -1) return acc;
    const key = line.substring(0, idx).trim();
    const val = line.substring(idx + 1).trim();
    acc[key] = val;
    return acc;
  }, {});
}

function serializeEnv(obj) {
  return Object.entries(obj).map(([k, v]) => `${k}=${v}`).join('\n') + '\n';
}

// Only auto-generate defaults in non-production environments.
const isProd = process.env.NODE_ENV === 'production';
if (!isProd) {
  let env = {};
  if (fs.existsSync(envPath)) {
    env = parseEnv(fs.readFileSync(envPath, 'utf8'));
  } else if (fs.existsSync(examplePath)) {
    env = parseEnv(fs.readFileSync(examplePath, 'utf8'));
  }

  let changed = false;
  for (const [k, v] of Object.entries(DEFAULTS)) {
    if (!env[k]) {
      env[k] = v;
      changed = true;
    }
  }

  if (!env.JWT_SECRET || env.JWT_SECRET === 'replace_with_a_long_random_secret' || env.JWT_SECRET.length < 32) {
    env.JWT_SECRET = generateSecret();
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(envPath, serializeEnv(env), { encoding: 'utf8', flag: 'w' });
    // لا نطبع السر نفسه. نعلم فقط أن ملف .env تم إنشاؤه/تعديله
    console.log('Created/updated .env with required defaults (JWT_SECRET generated if needed).');
  }
}

export default true;
