const rateLimit = require("express-rate-limit");

const authRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  max: 50,
  standardHeaders: true,
  legacyHeaders: false
});

const promptRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 60,
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { authRateLimiter, promptRateLimiter };