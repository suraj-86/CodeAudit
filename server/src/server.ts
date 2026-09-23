import "dotenv/config";

import cors from "cors";
import express from "express";

import uploadRouter from "./routes/upload.routes.js";
import { generalRateLimiter } from "./middleware/rate-limit.js";

import aiRouter from "./routes/ai.routes.js";

const app = express();

const port = Number(process.env.PORT) || 4000;

app.use(cors());
app.use(express.json());
app.use("/api", generalRateLimiter);

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "CodeAudit API",
  });
});

app.use("/api", uploadRouter);
app.use("/api", aiRouter);

app.listen(port, () => {
  console.log(`CodeAudit API running on http://localhost:${port}`);
});