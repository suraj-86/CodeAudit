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

    // Render (and most PaaS hosts) put the app behind a single reverse
    // proxy that sets X-Forwarded-For to the real client IP. Express's
    // default `trust proxy` is false, so req.ip stays the proxy's own
    // address — and express-rate-limit refuses to start up in that state
    // (ERR_ERL_UNEXPECTED_X_FORWARDED_FOR) because it can't tell whether
    // the forwarded header is trustworthy or spoofed by the client.
    // Trusting exactly one hop tells Express (and in turn express-rate-limit)
    // to use the proxy's X-Forwarded-For value as the real client IP,
    // which is correct for exactly this one-reverse-proxy deployment shape.
    app.set("trust proxy", 1);

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
