import type { BatchSubmission } from "./submission.js";
import type { BatchPairComparison } from "./compare.js";
import { generateSubmissionPairs } from "./pairs.js";
import { compareSubmissionPair } from "./compare.js";

export interface PairwiseMatrix {
    submissionIds: string[];
    comparisons: BatchPairComparison[];
}

export function generatePairwiseMatrix(
    submissions: BatchSubmission[],
    structuralThreshold: number,
): PairwiseMatrix {
    const pairs = generateSubmissionPairs(submissions);

    const comparisons = pairs.map((pair) =>
        compareSubmissionPair(
            pair,
            structuralThreshold,
        ),
    );

    return {
        submissionIds: submissions.map(
            (submission) => submission.id,
        ),
        comparisons,
    };
}