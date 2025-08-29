const router = require("express").Router();
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");
const { saveApiKeySchema } = require("../validators/schemas");
const { saveApiKey, getApiKeyStatus, deleteApiKey } = require("../controllers/userController");

router.get("/apikey/status", auth, getApiKeyStatus);
router.post("/apikey", auth, validate(saveApiKeySchema), saveApiKey);
router.delete("/apikey", auth, deleteApiKey);

module.exports = router;