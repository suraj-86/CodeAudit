import type { BatchSubmission } from "./submission.js";
import { generatePairwiseMatrix } from "./matrix.js";

function createSubmission(
    id: string,
    source: string,
): BatchSubmission {
    return {
        id,
        name: `${id}.cpp`,
        language: "cpp",
        source: Buffer.from(source, "utf8"),
    };
}

const submissions: BatchSubmission[] = [
    createSubmission(
        "A",
        "int add(int a, int b) { return a + b; }",
    ),
    createSubmission(
        "B",
        "int add(int a, int b) { return a + b; }",
    ),
    createSubmission(
        "C",
        "int multiply(int a, int b) { return a * b; }",
    ),
];

const matrix = generatePairwiseMatrix(
    submissions,
    0.70,
);

if (matrix.submissionIds.length !== 3) {
    throw new Error(
        "Matrix should contain three submission IDs.",
    );
}

if (
    matrix.submissionIds[0] !== "A" ||
    matrix.submissionIds[1] !== "B" ||
    matrix.submissionIds[2] !== "C"
) {
    throw new Error(
        "Submission IDs should be preserved in matrix order.",
    );
}

if (matrix.comparisons.length !== 3) {
    throw new Error(
        "Three submissions should produce three comparisons.",
    );
}

const firstComparison = matrix.comparisons[0];

if (!firstComparison) {
    throw new Error(
        "First matrix comparison should exist.",
    );
}

if (
    firstComparison.firstId !== "A" ||
    firstComparison.secondId !== "B"
) {
    throw new Error(
        "First comparison should be A-B.",
    );
}

if (!firstComparison.exactMatch) {
    throw new Error(
        "Identical submissions should be an exact match.",
    );
}

const secondComparison = matrix.comparisons[1];

if (!secondComparison) {
    throw new Error(
        "Second matrix comparison should exist.",
    );
}

if (
    secondComparison.firstId !== "A" ||
    secondComparison.secondId !== "C"
) {
    throw new Error(
        "Second comparison should be A-C.",
    );
}

const thirdComparison = matrix.comparisons[2];

if (!thirdComparison) {
    throw new Error(
        "Third matrix comparison should exist.",
    );
}

if (
    thirdComparison.firstId !== "B" ||
    thirdComparison.secondId !== "C"
) {
    throw new Error(
        "Third comparison should be B-C.",
    );
}

console.log("PASS: pairwise matrix generation");