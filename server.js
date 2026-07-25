import express from "express";
import cors from "cors";
import { ENV } from "./env.js";
import { healthRoute } from "./routes/healthRoute.js";

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API is running.",
  });
});

app.use("/", healthRoute);

app.listen(ENV.PORT, () => {
  console.log(`Server is running on port ${ENV.PORT}`);
});
