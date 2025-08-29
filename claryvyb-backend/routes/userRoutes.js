import { Router } from "express";
import auth from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { saveApiKeySchema } from "../validators/schemas.js";
import { saveApiKey, getApiKeyStatus, deleteApiKey, getProfile } from "../controllers/userController.js";

const router = Router();

router.get("/apikey/status", auth, getApiKeyStatus);
router.put("/apikey", auth, validate(saveApiKeySchema), saveApiKey);
router.delete("/apikey", auth, deleteApiKey);
router.get("/profile", auth, getProfile);

export default router;