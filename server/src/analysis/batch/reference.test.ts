import {
    analyzeAgainstReference,
    compareSubmissionToReference,
} from "./reference.js";
import type { BatchSubmission } from "./submission.js";

function assert(
    condition: boolean,
    message: string,
): void {
    if (!condition) {
        throw new Error(message);
    }
}

function submission(
    id: string,
    name: string,
    source: string,
): BatchSubmission {
    return {
        id,
        name,
        language: "cpp",
        source: Buffer.from(source, "utf8"),
    };
}

const reference = submission(
    "reference",
    "reference.cpp",
    `
int add(int a, int b) {
    return a + b;
}
`,
);

const identical = submission(
    "submission-1",
    "submission1.cpp",
    `
int add(int a, int b) {
    return a + b;
}
`,
);

const renamed = submission(
    "submission-2",
    "submission2.cpp",
    `
int sum(int x, int y) {
    return x + y;
}
`,
);

const different = submission(
    "submission-3",
    "submission3.cpp",
    `
int multiply(int a, int b) {
    return a * b;
}
`,
);

const identicalResult = compareSubmissionToReference(
    reference,
    identical,
    0.95,
);

assert(
    identicalResult.similarity === 1,
    "Identical reference implementation should have similarity 1.",
);

assert(
    identicalResult.suspicious,
    "Similarity at or above threshold should be marked suspicious.",
);

const renamedResult = compareSubmissionToReference(
    reference,
    renamed,
    0.95,
);

assert(
    renamedResult.similarity === 1,
    "Identifier renaming should preserve structural similarity.",
);

const differentResult = compareSubmissionToReference(
    reference,
    different,
    0.95,
);

assert(
    differentResult.similarity < 0.95,
    "Different structural implementation should fall below threshold.",
);

const results = analyzeAgainstReference(
    reference,
    [identical, renamed, different],
    0.95,
);

assert(
    results.length === 3,
    "Reference analysis should produce one result per submission.",
);

assert(
    results.every(
        (result) => result.referenceId === "reference",
    ),
    "Every result should identify the same reference solution.",
);

assert(
    results[0]?.submissionId === "submission-1",
    "Results should preserve submission order.",
);

console.log("PASS: reference comparison");
console.log("PASS: reference batch analysis");