import { Router } from "express";
import validate from "../middleware/validate.js";
import { authRateLimiter } from "../middleware/rateLimits.js";
import { registerSchema, loginSchema } from "../validators/schemas.js";
import { register, login, logout } from "../controllers/authController.js";

const router = Router();

router.post("/register", authRateLimiter, validate(registerSchema), register);
router.post("/login", authRateLimiter, validate(loginSchema), login);
router.post("/logout", logout);

export default router;