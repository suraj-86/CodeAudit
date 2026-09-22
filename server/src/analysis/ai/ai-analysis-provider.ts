import type { AIAnalysisRequest } from "./ai-analysis-request.js";
import type { AIAnalysisResult } from "./ai-analysis-result.js";

export interface AIAnalysisProvider {
    analyze(
        request: AIAnalysisRequest,
    ): Promise<AIAnalysisResult>;
}