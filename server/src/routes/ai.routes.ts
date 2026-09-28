import { Router } from "express";

import { AIAnalysisService } from "../analysis/ai/ai-analysis-service.js";
import { GeminiAnalysisProvider } from "../analysis/ai/gemini-provider.js";
import { createAiRateLimiter } from "../middleware/rate-limit.js";

const router = Router();

const aiRateLimiter = createAiRateLimiter();

const aiAnalysisProvider = new GeminiAnalysisProvider();
const aiAnalysisService = new AIAnalysisService(
    aiAnalysisProvider,
);

router.post("/analyze/ai", aiRateLimiter, async (req, res) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const { language, source } = body;

    if (typeof language !== "string" || !language.trim()) {
        return res.status(400).json({
            error: {
                code: "LANGUAGE_REQUIRED",
                message: "Language is required.",
                details: null,
            },
        });
    }

    if (typeof source !== "string" || !source.trim()) {
        return res.status(400).json({
            error: {
                code: "SOURCE_REQUIRED",
                message: "Source code is required.",
                details: null,
            },
        });
    }

    try {
        const result = await aiAnalysisService.analyze({
            language: language.trim(),
            source,
        });

        return res.status(200).json(result);
    } catch (error) {
        console.error("AI analysis failed:", error);

        return res.status(500).json({
            error: {
                code: "AI_ANALYSIS_FAILED",
                message: "AI analysis failed.",
                details: null,
            },
        });
    }
});

export default router;