import rateLimit from "express-rate-limit";

export const authRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  max: 50,
  standardHeaders: true,
  legacyHeaders: false
});

export const promptRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 60,
  standardHeaders: true,
  legacyHeaders: false
});