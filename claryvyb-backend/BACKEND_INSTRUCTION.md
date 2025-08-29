## Extremely important

Never forget to log to TODO.txt.
Aything related to testing, or running the server should be left to the developer.... ask the developer.
Always cross check through the app before implentation so as to avoid repetition and mistakes......

## INSTRUCTIONS

Purpose: Implement the ClaryVyb MVP backend (Express + MongoDB) with JWT auth and encrypted per-user Groq API keys. No history. Two endpoints: /clarify and /concise.
Non-negotiables: Security (hashed passwords, AES-encrypted API keys), clean modular structure, strong validation, clear error handling, production-ready basics (CORS, Helmet, rate limits).
Tracking: Always update TODO.txt after each step (add a [x] when done). If you change a file, append a brief “ChangeLog” line to TODO.txt noting file + purpose.

0. Ground Rules for Gemini

Comment code generously (what & why, not just what).

Prefer small, single-purpose functions.

Fail fast with meaningful HTTP errors and JSON payloads { error, details? }.

Never log secrets (passwords, JWTs, API keys).

Use Joi for request validation (middleware).

Use AES-256-CBC for API-key encryption with random IV per key.

Use axios for Groq calls (no streaming in MVP).

After every implementation step:

Run npm run dev locally, ensure no runtime errors.

Add a checklist tick in TODO.txt.

Note any files you created/edited.

1. Project Structure (create exactly)
   claryvyb-backend/
   │
   ├── server.js
   ├── package.json
   ├── .env.example
   ├── README.md
   ├── TODO.txt
   │
   ├── config/
   │ └── db.js
   │
   ├── models/
   │ └── User.js
   │
   ├── middleware/
   │ ├── auth.js
   │ ├── errorHandler.js
   │ ├── validate.js
   │ └── rateLimits.js
   │
   ├── validators/
   │ └── schemas.js
   │
   ├── utils/
   │ └── crypto.js
   │
   ├── services/
   │ └── groqService.js
   │
   ├── controllers/
   │ ├── authController.js
   │ ├── userController.js
   │ └── promptController.js
   │
   └── routes/
   ├── authRoutes.js
   ├── userRoutes.js
   └── promptRoutes.js

Update TODO.txt with the structure creation.

2. package.json (scripts & deps) [Already installed...skip]

Create package.json with:

{
"name": "claryvyb-backend",
"version": "1.0.0",
"main": "server.js",
"type": "commonjs",
"scripts": {
"start": "node server.js",
"dev": "nodemon server.js"
},
"dependencies": {
"axios": "^1.7.0",
"bcrypt": "^5.1.1",
"compression": "^1.7.4",
"cors": "^2.8.5",
"dotenv": "^16.4.5",
"express": "^4.19.2",
"express-rate-limit": "^7.1.5",
"helmet": "^7.1.0",
"joi": "^17.12.1",
"jsonwebtoken": "^9.0.2",
"mongoose": "^8.5.0",
"morgan": "^1.10.0"
},
"devDependencies": {
"nodemon": "^3.1.0"
}
}

TODO.txt: add “Initialized package.json & scripts”.

3. .env.example

Create:

PORT=5000
MONGO_URI=mongodb+srv://elkanahdonkor:th6WU28nn6ryygeX@learningmongo.oo1584i.mongodb.net/ClaryVybdatabase?retryWrites=true&w=majority&appName=LearningMongo
JWT_SECRET=replace_with_strong_random_secret
ENCRYPTION_SECRET=replace_with_strong_random_secret
NODE_ENV=development

(Do not commit real .env.)

4. server.js (app bootstrap)
   const express = require("express");
   const dotenv = require("dotenv");
   const cors = require("cors");
   const helmet = require("helmet");
   const morgan = require("morgan");
   const compression = require("compression");
   const errorHandler = require("./middleware/errorHandler");
   const connectDB = require("./config/db");

dotenv.config();
const app = express();

// Connect DB
connectDB();

// Core middleware
app.use(express.json({ limit: "1mb" }));
app.use(helmet());
app.use(compression());
app.use(cors({ origin: "\*", credentials: false })); // refine origin later
if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));

// Health
app.get("/api/health", (\_req, res) => res.json({ ok: true }));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/prompt", require("./routes/promptRoutes"));

// 404
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// Error handler (last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`ClaryVyb API on :${PORT}`));

TODO.txt: “server.js created”.

5. config/db.js (Mongo connection)
   const mongoose = require("mongoose");

module.exports = async function connectDB() {
const uri = process.env.MONGO_URI;
if (!uri) {
console.error("MONGO_URI missing");
process.exit(1);
}
try {
await mongoose.connect(uri, {
serverSelectionTimeoutMS: 10000
});
console.log("MongoDB connected");
} catch (err) {
console.error("MongoDB connection error:", err.message);
process.exit(1);
}
};

6. models/User.js
   const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
{
email: { type: String, required: true, unique: true, index: true },
password: { type: String, required: true }, // bcrypt hash
apiKey: { type: String } // AES-encrypted Groq key (iv:cipherHex)
},
{ timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

7. utils/crypto.js (AES-256-CBC)
   const crypto = require("crypto");
   const algorithm = "aes-256-cbc";

// Derive a 32-byte key from ENCRYPTION_SECRET
const key = crypto.scryptSync(
process.env.ENCRYPTION_SECRET || "fallback_secret",
"claryvyb_salt",
32
);

function encrypt(plain) {
const iv = crypto.randomBytes(16);
const cipher = crypto.createCipheriv(algorithm, key, iv);
let enc = cipher.update(plain, "utf8", "hex");
enc += cipher.final("hex");
return `${iv.toString("hex")}:${enc}`;
}

function decrypt(payload) {
const [ivHex, enc] = String(payload).split(":");
const iv = Buffer.from(ivHex, "hex");
const decipher = crypto.createDecipheriv(algorithm, key, iv);
let dec = decipher.update(enc, "hex", "utf8");
dec += decipher.final("utf8");
return dec;
}

module.exports = { encrypt, decrypt };

8. middleware/auth.js (JWT guard)
   const jwt = require("jsonwebtoken");

module.exports = function auth(req, res, next) {
const header = req.header("Authorization");
const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
if (!token) return res.status(401).json({ error: "Unauthorized" });
try {
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = { id: decoded.id };
return next();
} catch (err) {
return res.status(401).json({ error: "Invalid token" });
}
};

9. middleware/errorHandler.js
   module.exports = function errorHandler(err, \_req, res, \_next) {
   console.error("[ERROR]", err.message);
   const status = err.status || 500;
   res.status(status).json({
   error: err.expose ? err.message : "Internal server error"
   });
   };

10. middleware/validate.js (Joi wrapper)
    module.exports = function validate(schema) {
    return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
    });
    if (error) {
    return res.status(400).json({
    error: "Validation failed",
    details: error.details.map(d => d.message)
    });
    }
    req.body = value;
    next();
    };
    };

11. middleware/rateLimits.js
    const rateLimit = require("express-rate-limit");

const authRateLimiter = rateLimit({
windowMs: 10 _ 60 _ 1000, // 10 min
max: 50,
standardHeaders: true,
legacyHeaders: false
});

const promptRateLimiter = rateLimit({
windowMs: 60 \* 1000, // 1 min
max: 60,
standardHeaders: true,
legacyHeaders: false
});

module.exports = { authRateLimiter, promptRateLimiter };

12. validators/schemas.js (Joi)
    const Joi = require("joi");

const email = Joi.string().email().max(254).required();
const password = Joi.string().min(6).max(128).required();

const registerSchema = Joi.object({
email,
password
});

const loginSchema = Joi.object({
email,
password
});

const saveApiKeySchema = Joi.object({
apiKey: Joi.string().min(20).max(200).required() // allow future formats
});

const promptSchema = Joi.object({
input: Joi.string().min(1).max(8000).required()
});

module.exports = {
registerSchema,
loginSchema,
saveApiKeySchema,
promptSchema
};

13. services/groqService.js (non-streaming)
    const axios = require("axios");

async function runGroq(userApiKey, model, messages) {
try {
const resp = await axios.post(
"https://api.groq.com/openai/v1/chat/completions",
{ model, messages, stream: false },
{
headers: {
Authorization: `Bearer ${userApiKey}`,
"Content-Type": "application/json"
},
timeout: 20000
}
);
const choice = resp?.data?.choices?.[0];
if (!choice?.message?.content) {
throw new Error("Groq returned no content");
}
return choice.message.content;
} catch (err) {
const msg =
err.response?.data?.error?.message ||
err.message ||
"Groq request failed";
const e = new Error(`Groq error: ${msg}`);
e.status = 502;
throw e;
}
}

module.exports = { runGroq };

14. controllers/authController.js
    const bcrypt = require("bcrypt");
    const jwt = require("jsonwebtoken");
    const User = require("../models/User");

exports.register = async (req, res, next) => {
try {
const { email, password } = req.body;
const exists = await User.findOne({ email });
if (exists) return res.status(409).json({ error: "Email already in use" });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hash });
    return res.json({ success: true, user: { id: user._id, email: user.email } });

} catch (err) {
next(err);
}
};

exports.login = async (req, res, next) => {
try {
const { email, password } = req.body;
const user = await User.findOne({ email }).lean();
if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d"
    });
    return res.json({ token });

} catch (err) {
next(err);
}
};

15. controllers/userController.js
    const { encrypt } = require("../utils/crypto");
    const User = require("../models/User");

exports.saveApiKey = async (req, res, next) => {
try {
const { apiKey } = req.body;
const enc = encrypt(apiKey);
await User.findByIdAndUpdate(req.user.id, { apiKey: enc }, { new: true });
return res.json({ success: true, message: "API key saved securely" });
} catch (err) {
next(err);
}
};

exports.getApiKeyStatus = async (req, res, next) => {
try {
const user = await User.findById(req.user.id).select("apiKey").lean();
return res.json({ hasApiKey: Boolean(user?.apiKey) });
} catch (err) {
next(err);
}
};

exports.deleteApiKey = async (req, res, next) => {
try {
await User.findByIdAndUpdate(req.user.id, { $unset: { apiKey: 1 } });
return res.json({ success: true, message: "API key removed" });
} catch (err) {
next(err);
}
};

16. controllers/promptController.js
    const User = require("../models/User");
    const { decrypt } = require("../utils/crypto");
    const { runGroq } = require("../services/groqService");

const MODEL = "llama-3.1-8b-instant";

exports.clarify = async (req, res, next) => {
try {
const { input } = req.body;
const user = await User.findById(req.user.id).select("apiKey").lean();
if (!user?.apiKey) return res.status(400).json({ error: "No Groq API key on file" });

    const apiKey = decrypt(user.apiKey);
    const messages = [
      {
        role: "system",
        content:
          "You are a prompt architect. Rewrite user prompts into structured blueprints with four sections: " +
          "1) Goal (one sentence), 2) Main Steps (numbered), 3) Actionable To-Dos (checklist), " +
          "4) Edge Cases & Safeguards (bullet points). Keep it practical and precise."
      },
      { role: "user", content: input }
    ];

    const output = await runGroq(apiKey, MODEL, messages);
    return res.json({ output });

} catch (err) {
next(err);
}
};

exports.concise = async (req, res, next) => {
try {
const { input } = req.body;
const user = await User.findById(req.user.id).select("apiKey").lean();
if (!user?.apiKey) return res.status(400).json({ error: "No Groq API key on file" });

    const apiKey = decrypt(user.apiKey);
    const messages = [
      {
        role: "system",
        content:
          "Rewrite the user's prompt to be as clear and concise as possible without adding new requirements, " +
          "structure, or strategy. Preserve original intent."
      },
      { role: "user", content: input }
    ];

    const output = await runGroq(apiKey, MODEL, messages);
    return res.json({ output });

} catch (err) {
next(err);
}
};

17. routes/\*

routes/authRoutes.js

const router = require("express").Router();
const validate = require("../middleware/validate");
const { authRateLimiter } = require("../middleware/rateLimits");
const { registerSchema, loginSchema } = require("../validators/schemas");
const { register, login } = require("../controllers/authController");

router.post("/register", authRateLimiter, validate(registerSchema), register);
router.post("/login", authRateLimiter, validate(loginSchema), login);

module.exports = router;

routes/userRoutes.js

const router = require("express").Router();
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");
const { saveApiKeySchema } = require("../validators/schemas");
const { saveApiKey, getApiKeyStatus, deleteApiKey } = require("../controllers/userController");

router.get("/apikey/status", auth, getApiKeyStatus);
router.post("/apikey", auth, validate(saveApiKeySchema), saveApiKey);
router.delete("/apikey", auth, deleteApiKey);

module.exports = router;

routes/promptRoutes.js

const router = require("express").Router();
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");
const { promptRateLimiter } = require("../middleware/rateLimits");
const { promptSchema } = require("../validators/schemas");
const { clarify, concise } = require("../controllers/promptController");

router.post("/clarify", auth, promptRateLimiter, validate(promptSchema), clarify);
router.post("/concise", auth, promptRateLimiter, validate(promptSchema), concise);

module.exports = router;

18. README.md (brief)

Add a minimal README describing setup, env, scripts, endpoints (you can reuse the earlier documentation you have).

19. Testing Checklist (curl)

Register

curl -X POST http://localhost:5000/api/auth/register \
 -H "Content-Type: application/json" \
 -d '{"email":"test@ex.com","password":"secret123"}'

Login

TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
 -H "Content-Type: application/json" \
 -d '{"email":"test@ex.com","password":"secret123"}' | jq -r .token)
echo $TOKEN

Save API key

curl -X POST http://localhost:5000/api/user/apikey \
 -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
 -d '{"apiKey":"gsk_your_groq_api_key_here"}'

Clarify

curl -X POST http://localhost:5000/api/prompt/clarify \
 -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
 -d '{"input":"Build an Express.js API with JWT and MongoDB"}'

Concise

curl -X POST http://localhost:5000/api/prompt/concise \
 -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
 -d '{"input":"Help me write a short prompt to test an AI tool for coding"}'

API key status

curl -X GET http://localhost:5000/api/user/apikey/status \
 -H "Authorization: Bearer $TOKEN"

20. Security Notes

Never return or log decrypted API keys.

Use strong JWT_SECRET and ENCRYPTION_SECRET.

Enable HTTPS in production (platform-provided).

Consider tightening CORS to your extension ID later.

Rate-limit auth and prompt routes (already included).

21. Deployment (MVP)

DB: MongoDB Atlas free tier.

API: Render / Railway / Fly.io / Vercel (Node server).

Add env vars from .env.example.

Set build/start: npm install, npm run start.

22. Post-Build Sanity

Run npm run dev.

Hit /api/health → { ok: true }.

Complete curl tests above.

Update TODO.txt with all completed steps and any deviations.

DONE Criteria

All routes respond with correct status codes and payloads.

Validation rejects bad requests with helpful messages.

Clarify/Concise return Groq model outputs.

User can log in once, save API key once, and then just use the tool.
