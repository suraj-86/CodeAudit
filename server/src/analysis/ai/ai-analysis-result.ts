export type AIAnalysisLabel =
    | "low"
    | "medium"
    | "high"
    | "unavailable";

export interface AIAnalysisObservation {
    category: string;
    description: string;
}

export interface AIAnalysisResult {
    available: boolean;
    provider: string;
    indicator?: number;
    label: AIAnalysisLabel;
    confidence?: number;
    observations: AIAnalysisObservation[];
    disclaimer: string;
    error?: string;
}