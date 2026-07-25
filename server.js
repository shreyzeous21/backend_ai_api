import express from "express";
import cors from "cors";
import { ENV } from "./env.js";
import healthRoute from "./routes/healthRoute.js";
import aiChatRoute from "./routes/aiChatRoute.js";

const API_VERSION = "/api/v1";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
  }),
);

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
});
