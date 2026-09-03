import { jaccardSimilarity } from "./similarity.js";
import type { StructuralSimilarityResult } from "./similarity-result.js";

export function compareStructuralSequences(
    first: string[],
    second: string[],
    threshold: number,
): StructuralSimilarityResult {
    if (threshold < 0 || threshold > 1) {
        throw new Error("Similarity threshold must be between 0 and 1.");
    }

    const similarity = jaccardSimilarity(first, second);

    return {
        similarity,
        threshold,
        suspicious: similarity >= threshold,
    };
}