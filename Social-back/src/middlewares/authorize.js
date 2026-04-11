const toIdString = (value) => {
  if (value == null) return '';
  return typeof value.toString === 'function' ? value.toString() : String(value);
};

export const adminOnly = (req, res, next) => {
  if (!req.userIsAdmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  return next();
};

export const ownerOrAdmin = (getResource) => {
  return async (req, res, next) => {
    try {
      const resource = await getResource(req);
      if (!resource) {
        return res.status(404).json({ error: 'Not found' });
      }

      const resourceUserId = toIdString(resource.userId);
      const requesterId = toIdString(req.userId);
      if (resourceUserId !== requesterId && !req.userIsAdmin) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      req.resource = resource;
      return next();
    } catch (error) {
      return next(error);
    }
  };
};

export const ownerOnly = (getResource) => {
  return async (req, res, next) => {
    try {
      const resource = await getResource(req);
      if (!resource) {
        return res.status(404).json({ error: 'Not found' });
      }

      const resourceUserId = toIdString(resource.userId);
      const requesterId = toIdString(req.userId);
      if (resourceUserId !== requesterId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      req.resource = resource;
      return next();
    } catch (error) {
      return next(error);
    }
  };
};

export default { adminOnly, ownerOrAdmin, ownerOnly };