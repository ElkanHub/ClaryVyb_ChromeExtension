const router = require("express").Router();
const validate = require("../middleware/validate");
const { authRateLimiter } = require("../middleware/rateLimits");
const { registerSchema, loginSchema } = require("../validators/schemas");
const { register, login } = require("../controllers/authController");

router.post("/register", authRateLimiter, validate(registerSchema), register);
router.post("/login", authRateLimiter, validate(loginSchema), login);

module.exports = router;