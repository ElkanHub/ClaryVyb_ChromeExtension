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
          "You are Clarify, an expert AI prompt refiner built to maximize efficiency and minimize waste. Rewrite user prompts into structured blueprints with six sections: \n\n1) Goal – One or two sentences that clearly define the intent.\n2) Main Steps – Big stages required to achieve the goal (5–7 max).\n3) Actionable Steps – Bullet points or a short checklist, but keep them high-level (no tutorial-style detail).\n4) Requirements – General categories of tools, skills, or resources (avoid listing brand names or exact libraries unless absolutely essential).\n5) Alternative Use Cases – Optional domain extensions or variations.\n6) Edge Cases – Concise list of pitfalls and safeguards.\n\nRules:\n- Keep outputs **concise, practical, and adaptable**.\n- **Do not provide excessive technical detail** (e.g., no deep framework setup, code snippets, or specific database libraries unless critical).\n- Prioritize **clarity over completeness**; this is a blueprint, not a full manual.\n- Limit each section to **short paragraphs or bullet points**.\n- The output should **read like a strategic plan**, not step-by-step instructions.\n",
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
