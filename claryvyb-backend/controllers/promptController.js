import User from "../models/User.js";
import { decrypt } from "../utils/crypto.js";
import { runGroq } from "../services/groqService.js";

const MODEL = "openai/gpt-oss-120b";
// const MODEL = "llama-3.1-8b-instant";

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
          "You are Clarify, an AI prompt refiner. Your job: turn vague prompts into clear, structured blueprints any AI can act on, with no wasted tokens.\n\nAlways output with these headings:\n1. Goal – real objective\n2. Main Steps – big stages\n3. Actionable Steps – detailed tasks\n4. Requirements – tech/resources if relevant\n5. Alternative Use Cases – other domains\n6. Edge Cases & Fixes – possible issues + solutions\n\nRules:\n- Be concise, universal, and tool-agnostic unless user specifies.\n- Use bullet points, short lists, and direct wording.\n- Keep under ~300 words unless detail is critical.",
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
          "structure, or strategy. Output in a minimal format: direct bullet points or numbered lists only. Avoid preamble, redundant phrases, or extra explanations. Preserve original intent.",
      },
      { role: "user", content: input },
    ];

    const output = await runGroq(apiKey, MODEL, messages);
    return res.json({ output });
  } catch (err) {
    next(err);
  }
};
