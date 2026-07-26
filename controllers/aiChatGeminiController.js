import { GoogleGenAI } from "@google/genai";

const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY_LENGTH = 50;
const REQUEST_TIMEOUT_MS = 60000;

function withHardTimeout(promise, ms, label = "operation") {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(`${label} timed out after ${ms}ms`);
      err.name = "HardTimeoutError";
      reject(err);
    }, ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() =>
    clearTimeout(timer),
  );
}

export const postChat = async (req, res, apiKey, model, system_prompt) => {
  const message = req.body?.message;
  const history = Array.isArray(req.body?.history) ? req.body.history : [];

  if (!message?.trim()) {
    return res
      .status(400)
      .json({ success: false, message: "Message is required." });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return res
      .status(400)
      .json({ success: false, message: "Message is too long." });
  }
  if (!apiKey) {
    return res
      .status(400)
      .json({ success: false, message: "API key is required." });
  }
  if (!model) {
    return res
      .status(400)
      .json({ success: false, message: "Model is required." });
  }

  const sanitizedHistory = history
    .filter(
      (h) =>
        h &&
        (h.role === "user" || h.role === "assistant" || h.role === "model") &&
        typeof h.content === "string" &&
        h.content.trim().length > 0 &&
        h.content.length <= MAX_MESSAGE_LENGTH,
    )
    .slice(-MAX_HISTORY_LENGTH)
    .map((h) => ({
      role: h.role === "assistant" ? "model" : h.role,
      content: h.content,
    }));

  let response = "";
  let usage = null;

  try {
    const ai = new GoogleGenAI({ apiKey });

    let contents = message;
    if (sanitizedHistory.length > 0) {
      contents =
        sanitizedHistory.map((h) => `${h.role}: ${h.content}`).join("\n") +
        "\nuser: " +
        message;
    }

    // Correct method — ai.interactions.create() does NOT exist on this SDK.
    const stream = await withHardTimeout(
      ai.models.generateContentStream({
        model,
        contents,
        ...(system_prompt && {
          config: { systemInstruction: system_prompt },
        }),
      }),
      REQUEST_TIMEOUT_MS,
      "Gemini request",
    );

    for await (const chunk of stream) {
      if (chunk.text) {
        response += chunk.text;
      }
      if (chunk.usageMetadata) {
        usage = {
          promptTokens: chunk.usageMetadata.promptTokenCount ?? 0,
          completionTokens: chunk.usageMetadata.candidatesTokenCount ?? 0,
          totalTokens: chunk.usageMetadata.totalTokenCount ?? 0,
        };
      }
    }

    if (!response.trim()) {
      console.warn(`Model ${model} returned an empty response.`);
      return res
        .status(502)
        .json({ success: false, message: "Model returned an empty response." });
    }

    return res.status(200).json({
      success: true,
      data: response,
      ...(usage && { usage }),
    });
  } catch (error) {
    console.error("Gemini request failed:", {
      model,
      name: error?.name,
      message: error?.message,
      partialResponseLength: response.length,
    });

    if (error?.name === "HardTimeoutError") {
      return res.status(504).json({
        success: false,
        message: "Model timed out. Please try again.",
      });
    }
    if (error?.status === 429 || error?.statusCode === 429) {
      return res
        .status(429)
        .json({ success: false, message: "Rate limit exceeded." });
    }
    if (/api.?key|unauthorized|permission/i.test(error?.message ?? "")) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid or unauthorized API key." });
    }

    return res.status(502).json({
      success: false,
      message: "Model currently unavailable.",
      ...(process.env.NODE_ENV !== "production" && {
        debug: { message: error?.message, name: error?.name },
      }),
    });
  }
};
