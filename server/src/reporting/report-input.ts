import type { AIAnalysisResult } from "../analysis/ai/ai-analysis-result.js";
import type { ExecutionResult } from "../analysis/execution/execution-result.js";
import type { StructuralSimilarityResult } from "../analysis/structural/similarity-result.js";

export interface ReportInput {
  projectName?: string;

  sourceFiles: Array<{
    filename: string;
    language?: string;
    sha256?: string;
  }>;

  correctness?: {
    source: ExecutionResult;
    comparison?: ExecutionResult;
  };

  similarity?: StructuralSimilarityResult;

  aiAnalysis?: AIAnalysisResult;

  evidence?: Array<{
    category: string;
    description: string;
  }>;

  disclaimer?: string;

  generatedAt?: string;
}