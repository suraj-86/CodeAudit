import { analyzeBatch } from "./orchestrator.js";
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

const first = submission(
    "first",
    "first.cpp",
    `
int add(int a, int b) {
    return a + b;
}
`,
);

const second = submission(
    "second",
    "second.cpp",
    `
int add(int x, int y) {
    return x + y;
}
`,
);

const third = submission(
    "third",
    "third.cpp",
    `
int multiply(int a, int b) {
    return a * b;
}
`,
);

const result = analyzeBatch(
    [first, second, third],
    reference,
    0.95,
);

assert(
    result.submissions.length === 3,
    "Batch should contain all submissions.",
);

assert(
    result.matrix.submissionIds.length === 3,
    "Matrix should contain all submission IDs.",
);

assert(
    result.matrix.comparisons.length === 3,
    "Three submissions should produce three pair comparisons.",
);

assert(
    result.suspiciousPairs.length > 0,
    "Suspicious pairs should be returned.",
);

assert(
    result.suspiciousPairs.every(
        (pair) => pair.structuralSuspicious,
    ),
    "Ranking should contain only suspicious pairs.",
);

assert(
    result.suspiciousPairs[0]?.structuralSimilarity === 1,
    "Highest-similarity suspicious pair should rank first.",
);

assert(
    result.referenceComparisons.length === 3,
    "Reference analysis should produce one result per submission.",
);

assert(
    result.referenceComparisons.every(
        (comparison) =>
            comparison.referenceId === "reference",
    ),
    "Every reference comparison should use the supplied reference.",
);

assert(
    result.referenceComparisons[0]?.submissionId === "first",
    "Reference results should preserve submission order.",
);

console.log("PASS: batch orchestration");