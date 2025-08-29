import { Router } from "express";
import auth from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { promptRateLimiter } from "../middleware/rateLimits.js";
import { promptSchema } from "../validators/schemas.js";
import { clarify, concise } from "../controllers/promptController.js";

const router = Router();

router.post("/clarify", auth, promptRateLimiter, validate(promptSchema), clarify);
router.post("/concise", auth, promptRateLimiter, validate(promptSchema), concise);

export default router;