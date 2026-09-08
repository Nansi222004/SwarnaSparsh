const parseFormData = (fields) => (req, res, next) => {
  if (!req.body) return next();

  fields.forEach(field => {
    if (typeof req.body[field] === 'string') {
      try {
        req.body[field] = JSON.parse(req.body[field]);
      } catch (err) {
        // Log error if needed, but continue
        console.warn(`[Multipart] Failed to parse field "${field}":`, err.message);
      }
    }
  });

  next();
};

module.exports = parseFormData;
