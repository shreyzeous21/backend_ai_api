import { Router } from "express";
import { healthController } from "../controllers/healthController.js";

export const healthRoute = Router().get("/active", healthController);
