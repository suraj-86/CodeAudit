import type { BatchSubmission } from "./submission.js";
import { createSubmissionBatch } from "./batch.js";

function createSubmission(
    id: string,
): BatchSubmission {
    return {
        id,
        name: `${id}.cpp`,
        language: "cpp",
        source: Buffer.from(
            "int main() { return 0; }",
            "utf8",
        ),
    };
}

const minimumBatch = createSubmissionBatch([
    createSubmission("submission-1"),
]);

if (minimumBatch.submissions.length !== 1) {
    throw new Error("Minimum batch size should be accepted.");
}

console.log("PASS: minimum batch size");

const maximumBatch = createSubmissionBatch(
    Array.from(
        { length: 100 },
        (_, index) =>
            createSubmission(`submission-${index + 1}`),
    ),
);

if (maximumBatch.submissions.length !== 100) {
    throw new Error("Maximum batch size should be accepted.");
}

console.log("PASS: maximum batch size");

let emptyRejected = false;

try {
    createSubmissionBatch([]);
} catch {
    emptyRejected = true;
}

if (!emptyRejected) {
    throw new Error("Empty batch should be rejected.");
}

console.log("PASS: empty batch is rejected");

let excessiveRejected = false;

try {
    createSubmissionBatch(
        Array.from(
            { length: 101 },
            (_, index) =>
                createSubmission(`submission-${index + 1}`),
        ),
    );
} catch {
    excessiveRejected = true;
}

if (!excessiveRejected) {
    throw new Error("Excessive batch size should be rejected.");
}

console.log("PASS: excessive batch size is rejected");