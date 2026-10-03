import "dotenv/config";

import cors from "cors";
import express from "express";

import uploadRouter from "./routes/upload.routes.js";
import { createGeneralRateLimiter } from "./middleware/rate-limit.js";
import { buildCorsOptions } from "./config/cors.js";
import {
    errorHandler,
    notFoundHandler,
} from "./middleware/error-handler.js";

import aiRouter from "./routes/ai.routes.js";
import reportRouter from "./routes/report.routes.js";
import analyzeRouter from "./routes/analyze.routes.js";
import batchRouter from "./routes/batch.routes.js";

export function createApp(): express.Express {
    const app = express();

    app.use(cors(buildCorsOptions()));
    app.use(express.json({ limit: "5mb" }));
    app.use("/api", createGeneralRateLimiter());

    app.get("/api/health", (_req, res) => {
        res.json({
            status: "ok",
            service: "CodeAudit API",
        });
    });

    app.use("/api", uploadRouter);
    app.use("/api", aiRouter);
    app.use("/api", reportRouter);
    app.use("/api", analyzeRouter);
    app.use("/api", batchRouter);

    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
}
