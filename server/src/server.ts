import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import uploadRouter from "./routes/upload.routes.js";

dotenv.config();

const app = express();

const port = Number(process.env.PORT) || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "CodeAudit API",
  });
});

app.use("/api", uploadRouter);

app.listen(port, () => {
  console.log(`CodeAudit API running on http://localhost:${port}`);
});