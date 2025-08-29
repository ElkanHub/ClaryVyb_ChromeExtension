import { encrypt } from "../utils/crypto.js";
import User from "../models/User.js";

export const saveApiKey = async (req, res, next) => {
  try {
    const { apiKey } = req.body;
    const enc = encrypt(apiKey);
    await User.findByIdAndUpdate(req.user.id, { apiKey: enc }, { new: true });
    return res.json({ success: true, message: "API key saved securely" });
  } catch (err) {
    next(err);
  }
};

export const getApiKeyStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("apiKey").lean();
    return res.json({ hasApiKey: Boolean(user?.apiKey) });
  } catch (err) {
    next(err);
  }
};

export const deleteApiKey = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { $unset: { apiKey: 1 } });
    return res.json({ success: true, message: "API key removed" });
  } catch (err) {
    next(err);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("email createdAt updatedAt").lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    next(err);
  }
};