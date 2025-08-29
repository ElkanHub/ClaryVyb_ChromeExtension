module.exports = function errorHandler(err, _req, res, _next) {
  console.error("[ERROR]", err.message);
  const status = err.status || 500;
  res.status(status).json({
    error: err.expose ? err.message : "Internal server error"
  });
};