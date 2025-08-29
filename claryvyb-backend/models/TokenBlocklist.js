import mongoose from "mongoose";

const tokenBlocklistSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  createdAt: { type: Date, expires: '7d', default: Date.now }
});

const TokenBlocklist = mongoose.model("TokenBlocklist", tokenBlocklistSchema);
export default TokenBlocklist;