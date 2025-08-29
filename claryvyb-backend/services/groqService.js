import axios from "axios";

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

export { runGroq };
