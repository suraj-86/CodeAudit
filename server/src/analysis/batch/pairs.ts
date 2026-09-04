import type { BatchSubmission } from "./submission.js";

export interface SubmissionPair {
    first: BatchSubmission;
    second: BatchSubmission;
}

export function generateSubmissionPairs(
    submissions: BatchSubmission[],
): SubmissionPair[] {
    const pairs: SubmissionPair[] = [];

    for (
        let firstIndex = 0;
        firstIndex < submissions.length;
        firstIndex += 1
    ) {
        for (
            let secondIndex = firstIndex + 1;
            secondIndex < submissions.length;
            secondIndex += 1
        ) {
            pairs.push({
                first: submissions[firstIndex]!,
                second: submissions[secondIndex]!,
            });
        }
    }

    return pairs;
}