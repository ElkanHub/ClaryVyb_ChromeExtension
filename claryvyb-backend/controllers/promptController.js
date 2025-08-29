const User = require("../models/User");
const { decrypt } = require("../utils/crypto");
const { runGroq } = require("../services/groqService");

const MODEL = "llama-3.3-70b-instant";

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