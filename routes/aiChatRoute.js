import { Router } from "express";
import { postChat as postChatOpenrouter } from "../controllers/aiChatOpenrouterController.js";
import { postChat as postChatGemini } from "../controllers/aiChatGeminiController.js";

const router = Router();

router.post("/openrouter", async (req, res) => {
  const apiKey = req.headers["x-api-key"] || req.body.apiKey || "";
  const model = req.body.model || "";
  const system_prompt = req.body.system_prompt || "";
  await postChatOpenrouter(req, res, apiKey, model, system_prompt);
});

router.post("/gemini", async (req, res) => {
  const apiKey = req.headers["x-api-key"] || req.body.apiKey || "";
  const model = req.body.model || "";
  const system_prompt = req.body.system_prompt || "";
  await postChatGemini(req, res, apiKey, model, system_prompt);
});

export default router;
