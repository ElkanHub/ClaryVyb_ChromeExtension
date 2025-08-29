import { Router } from "express";
import auth from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { saveApiKeySchema } from "../validators/schemas.js";
import { saveApiKey, getApiKeyStatus, deleteApiKey } from "../controllers/userController.js";

const router = Router();

router.get("/apikey/status", auth, getApiKeyStatus);
router.post("/apikey", auth, validate(saveApiKeySchema), saveApiKey);
router.delete("/apikey", auth, deleteApiKey);

export default router;