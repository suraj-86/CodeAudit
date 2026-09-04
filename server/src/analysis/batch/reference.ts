import { parseCpp } from "../structural/cpp-parser.js";
import { structuralSequence } from "../structural/traversal.js";
import { compareStructuralSequences } from "../structural/compare.js";
import type { BatchSubmission } from "./submission.js";

export interface ReferenceComparison {
    submissionId: string;
    submissionName: string;
    referenceId: string;
    referenceName: string;
    similarity: number;
    threshold: number;
    suspicious: boolean;
}

function getStructuralSequence(
    submission: BatchSubmission,
): string[] {
    if (submission.language.toLowerCase() !== "cpp") {
        throw new Error(
            `Reference analysis currently supports C++ submissions only.`,
        );
    }

    const source = submission.source.toString("utf8");
    const tree = parseCpp(source);

    return structuralSequence(tree.rootNode);
}

export function compareSubmissionToReference(
    reference: BatchSubmission,
    submission: BatchSubmission,
    structuralThreshold: number,
): ReferenceComparison {
    const referenceSequence = getStructuralSequence(reference);
    const submissionSequence = getStructuralSequence(submission);

    const result = compareStructuralSequences(
        referenceSequence,
        submissionSequence,
        structuralThreshold,
    );

    return {
        submissionId: submission.id,
        submissionName: submission.name,
        referenceId: reference.id,
        referenceName: reference.name,
        similarity: result.similarity,
        threshold: result.threshold,
        suspicious: result.suspicious,
    };
}

export function analyzeAgainstReference(
    reference: BatchSubmission,
    submissions: BatchSubmission[],
    structuralThreshold: number,
): ReferenceComparison[] {
    return submissions.map((submission) =>
        compareSubmissionToReference(
            reference,
            submission,
            structuralThreshold,
        ),
    );
}