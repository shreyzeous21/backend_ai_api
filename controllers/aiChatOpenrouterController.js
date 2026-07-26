import { OpenRouter } from "@openrouter/sdk";

const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY_LENGTH = 50;

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

  const sanitizedHistory = history.filter(Boolean).slice(-MAX_HISTORY_LENGTH);

  let responseText = "";
  let totalUsage = null;

  try {
    const openrouter = new OpenRouter({ apiKey });

    const stream = await openrouter.chat.send({
      chatRequest: {
        model,
        stream: true,
        streamOptions: { includeUsage: true },
        messages: [
          { role: "system", content: system_prompt },
          ...sanitizedHistory,
          { role: "user", content: message },
        ],
      },
    });

    for await (const chunk of stream) {
      const content = chunk.choices?.[0]?.delta?.content;
      if (content) {
        responseText += content;
      }

      if (chunk.usage) {
        totalUsage = {
          promptTokens: chunk.usage.promptTokens ?? chunk.usage.prompt_tokens,
          completionTokens:
            chunk.usage.completionTokens ?? chunk.usage.completion_tokens,
          totalTokens: chunk.usage.totalTokens ?? chunk.usage.total_tokens,
        };
      }
    }

    return res.json({
      success: true,
      response: responseText,
      ...(totalUsage && { usage: totalUsage }),
    });
  } catch (error) {
    if (res.headersSent) {
      console.error("Error after response started:", error?.message);
      return;
    }

    if (error?.statusCode === 429) {
      return res
        .status(429)
        .json({ error: "Rate limit exceeded. Please try again later." });
    }
    if (error?.name === "RequestTimeoutError") {
      return res
        .status(504)
        .json({ error: "Model timed out. Please try again." });
    }
    return res.status(502).json({
      error: "Model currently unavailable.",
      ...(process.env.NODE_ENV !== "production" && {
        debug: {
          message: error?.message,
          name: error?.name,
          statusCode: error?.statusCode,
        },
      }),
    });
  }
};
