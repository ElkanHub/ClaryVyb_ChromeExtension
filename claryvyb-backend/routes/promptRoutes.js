const router = require("express").Router();
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");
const { promptRateLimiter } = require("../middleware/rateLimits");
const { promptSchema } = require("../validators/schemas");
const { clarify, concise } = require("../controllers/promptController");

router.post("/clarify", auth, promptRateLimiter, validate(promptSchema), clarify);
router.post("/concise", auth, promptRateLimiter, validate(promptSchema), concise);

module.exports = router;