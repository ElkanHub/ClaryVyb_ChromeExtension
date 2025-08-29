import User from "../models/User.js";
import { decrypt } from "../utils/crypto.js";
import { runGroq } from "../services/groqService.js";

const MODEL = "llama-3.1-8b-instant";

export const clarify = async (req, res, next) => {
  try {
    const { input } = req.body;
    const user = await User.findById(req.user.id).select("apiKey").lean();
    if (!user?.apiKey)
      return res.status(400).json({ error: "No Groq API key on file" });

    const apiKey = decrypt(user.apiKey);
    const messages = [
      {
        role: "system",
        content:
          "You are Clarify, an AI prompt refiner. Your job is to turn vague prompts into clear, structured instructions optimized for execution. " +
          "Always reduce ambiguity, wasted tokens, and re-prompts.\n\n" +
          "For each input:\n" +
          "1. Goal – Define the exact objective.\n" +
          "2. Main Steps – List key stages.\n" +
          "3. Actionable Steps – Break steps into detailed tasks.\n" +
          "4. Requirements – Note tech stack, dependencies, or standards if relevant.\n" +
          "5. Alternative Use Cases – Adapt rules for writing, design, or other domains.\n" +
          "6. Edge Cases – Anticipate pitfalls and fixes.\n" +
          "7. Output Format – Suggest best format (code, plan, essay, JSON). Skip if agentic use.\n\n" +
          "Keep outputs simple, precise, and adaptable.",
      },
      { role: "user", content: input },
    ];

    const output = await runGroq(apiKey, MODEL, messages);
    return res.json({ output });
  } catch (err) {
    next(err);
  }
};

export const concise = async (req, res, next) => {
  try {
    const { input } = req.body;
    const user = await User.findById(req.user.id).select("apiKey").lean();
    if (!user?.apiKey)
      return res.status(400).json({ error: "No Groq API key on file" });

    const apiKey = decrypt(user.apiKey);
    const messages = [
      {
        role: "system",
        content:
          "Rewrite the user's prompt to be as clear and concise as possible without adding new requirements, " +
          "structure, or strategy. Preserve original intent.",
      },
      { role: "user", content: input },
    ];

    const output = await runGroq(apiKey, MODEL, messages);
    return res.json({ output });
  } catch (err) {
    next(err);
  }
};
