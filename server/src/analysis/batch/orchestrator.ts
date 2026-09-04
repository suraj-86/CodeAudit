import type { BatchSubmission } from "./submission.js";
import type { PairwiseMatrix } from "./matrix.js";
import type { BatchPairComparison } from "./compare.js";
import type { ReferenceComparison } from "./reference.js";

import { createSubmissionBatch } from "./batch.js";
import { generatePairwiseMatrix } from "./matrix.js";
import { rankSuspiciousPairs } from "./ranking.js";
import { analyzeAgainstReference } from "./reference.js";

export interface BatchAnalysisResult {
    submissions: BatchSubmission[];
    matrix: PairwiseMatrix;
    suspiciousPairs: BatchPairComparison[];
    referenceComparisons: ReferenceComparison[];
}

export function analyzeBatch(
    submissions: BatchSubmission[],
    reference: BatchSubmission,
    structuralThreshold: number,
): BatchAnalysisResult {
    const batch = createSubmissionBatch(submissions);

    const matrix = generatePairwiseMatrix(
        batch.submissions,
        structuralThreshold,
    );

    const suspiciousPairs = rankSuspiciousPairs(matrix);

    const referenceComparisons = analyzeAgainstReference(
        reference,
        batch.submissions,
        structuralThreshold,
    );

    return {
        submissions: batch.submissions,
        matrix,
        suspiciousPairs,
        referenceComparisons,
    };
}