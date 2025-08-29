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