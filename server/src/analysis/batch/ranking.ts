import type { BatchPairComparison } from "./compare.js";
import type { PairwiseMatrix } from "./matrix.js";

export function rankSuspiciousPairs(
    matrix: PairwiseMatrix,
): BatchPairComparison[] {
    return matrix.comparisons
        .filter((comparison) => comparison.structuralSuspicious)
        .sort(
            (first, second) =>
                second.structuralSimilarity -
                first.structuralSimilarity,
        );
}