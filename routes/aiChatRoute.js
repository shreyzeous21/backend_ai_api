import { Router } from "express";
import { postChat } from "../controllers/aiChatController.js";

const router = Router();

router.post("/openrouter", async (req, res) => {
  const apiKey = req.headers["x-api-key"] || req.body.apiKey || "";
  const model = req.body.model || "";
  const system_prompt = req.body.system_prompt || "";
  await postChat(req, res, apiKey, model, system_prompt);
});

export default router;
