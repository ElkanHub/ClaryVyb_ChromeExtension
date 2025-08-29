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