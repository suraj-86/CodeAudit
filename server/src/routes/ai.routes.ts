import { Router } from "express";

import { AIAnalysisService } from "../analysis/ai/ai-analysis-service.js";
import { GeminiAnalysisProvider } from "../analysis/ai/gemini-provider.js";

const router = Router();

const aiAnalysisProvider = new GeminiAnalysisProvider();
const aiAnalysisService = new AIAnalysisService(
    aiAnalysisProvider,
);

router.post("/analyze/ai", async (req, res) => {
    const { language, source } = req.body ?? {};

    if (typeof language !== "string" || !language.trim()) {
        return res.status(400).json({
            error: "Language is required.",
        });
    }

    if (typeof source !== "string" || !source.trim()) {
        return res.status(400).json({
            error: "Source code is required.",
        });
    }

    try {
        const result = await aiAnalysisService.analyze({
            language: language.trim(),
            source,
        });

        return res.status(200).json(result);
    } catch {
        return res.status(500).json({
            error: "AI analysis failed.",
        });
    }
});

export default router;