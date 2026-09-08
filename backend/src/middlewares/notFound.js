/**
 * BUG-19 FIX: notFound.js was previously empty (0 bytes).
 * Unmatched routes now return a standardised JSON 404 response
 * instead of crashing the Express error handler.
 */
module.exports = (req, res) => {
  res.status(404).json({
    success: false,
    code: "ROUTE_NOT_FOUND",
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
};
