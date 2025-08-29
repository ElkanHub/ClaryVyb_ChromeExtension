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