import { UPLOAD_LIMITS } from "../../config/limits.js";

export function validateBatchSize(
    submissionCount: number,
): void {
    if (
        !Number.isInteger(submissionCount) ||
        submissionCount <= 0
    ) {
        throw new Error(
            "Batch submission count must be a positive integer.",
        );
    }

    if (
        submissionCount > UPLOAD_LIMITS.batch.maxSubmissions
    ) {
        throw new Error(
            "Batch exceeds the maximum submission limit.",
        );
    }
}