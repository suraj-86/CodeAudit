import type { AIAnalysisProvider } from "./ai-analysis-provider.js";
import type { AIAnalysisRequest } from "./ai-analysis-request.js";
import type { AIAnalysisResult } from "./ai-analysis-result.js";

export class AIAnalysisService {
    constructor(
        private readonly provider: AIAnalysisProvider,
    ) {}

    async analyze(
        request: AIAnalysisRequest,
    ): Promise<AIAnalysisResult> {
        return this.provider.analyze(request);
    }
}