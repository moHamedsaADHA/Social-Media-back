const cache = new Map();

export const getFromCache = (key) => {
  const item = cache.get(key);
  if (!item) return null;
  const { expiresAt, value } = item;
  if (expiresAt && Date.now() > expiresAt) {
    cache.delete(key);
    return null;
  }
  return value;
};

export const setCache = (key, value, ttlMs = 60 * 1000) => {
  cache.set(key, { value, expiresAt: ttlMs ? Date.now() + ttlMs : null });
};

export const cacheMiddleware = (ttlMs = 60000) => (req, res, next) => {
  if (req.method !== 'GET') return next();
  const key = `${req.originalUrl}`;
  const cached = getFromCache(key);
  if (cached) return res.status(200).json(cached);

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    setCache(key, body, ttlMs);
    return originalJson(body);
  };
  next();
};

export default cache;
