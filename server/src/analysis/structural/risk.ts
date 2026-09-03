export type SimilarityRisk =
    | "Low"
    | "Moderate"
    | "High"
    | "Very High";

export interface RiskThresholds {
    moderate: number;
    high: number;
    veryHigh: number;
}

export function classifySimilarityRisk(
    similarity: number,
    thresholds: RiskThresholds,
): SimilarityRisk {
    if (
        similarity < 0 ||
        similarity > 1
    ) {
        throw new Error(
            "Similarity must be between 0 and 1.",
        );
    }

    if (
        thresholds.moderate < 0 ||
        thresholds.moderate > 1 ||
        thresholds.high < 0 ||
        thresholds.high > 1 ||
        thresholds.veryHigh < 0 ||
        thresholds.veryHigh > 1
    ) {
        throw new Error(
            "Risk thresholds must be between 0 and 1.",
        );
    }

    if (
        thresholds.moderate >= thresholds.high ||
        thresholds.high >= thresholds.veryHigh
    ) {
        throw new Error(
            "Risk thresholds must be strictly increasing.",
        );
    }

    if (similarity >= thresholds.veryHigh) {
        return "Very High";
    }

    if (similarity >= thresholds.high) {
        return "High";
    }

    if (similarity >= thresholds.moderate) {
        return "Moderate";
    }

    return "Low";
}