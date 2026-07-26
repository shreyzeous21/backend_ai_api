import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { ENV } from "./env.js";
import healthRoute from "./routes/healthRoute.js";
import aiChatRoute from "./routes/aiChatRoute.js";

const API_VERSION = "/api/v1";

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(express.static("public"));

app.use(
  cors({
    origin:
      // ENV.NODE_ENV === "development"
      // ?
      "*",
    // : ENV.CORS_ORIGIN,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
  }),
);

const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

app.use(rateLimiter);

app.use(API_VERSION, healthRoute);

app.get("/", (_, res) => {
  res.json({
    success: true,
    message: "API is running.",
  });
});

app.use(API_VERSION, aiChatRoute);

app.listen(ENV.PORT, () => {
  console.log(`Server is running on port ${ENV.PORT}`);
  console.log(`Environment: ${ENV.NODE_ENV}`);
});
