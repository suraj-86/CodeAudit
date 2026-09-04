import type { BatchSubmission } from "./submission.js";
import { UPLOAD_LIMITS } from "../../config/limits.js";

export interface SubmissionBatch {
    submissions: BatchSubmission[];
}

export function createSubmissionBatch(
    submissions: BatchSubmission[],
): SubmissionBatch {
    if (submissions.length === 0) {
        throw new Error("A batch must contain at least one submission.");
    }

    if (
        submissions.length >
        UPLOAD_LIMITS.batch.maxSubmissions
    ) {
        throw new Error(
            `A batch cannot contain more than ${UPLOAD_LIMITS.batch.maxSubmissions} submissions.`,
        );
    }

    return {
        submissions: [...submissions],
    };
}