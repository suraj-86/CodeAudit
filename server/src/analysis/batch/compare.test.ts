import type { BatchSubmission } from "./submission.js";
import type { SubmissionPair } from "./pairs.js";
import { compareSubmissionPair } from "./compare.js";

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

const identicalPair: SubmissionPair = {
    first: createSubmission(
        "A",
        "int main() { return 0; }",
    ),
    second: createSubmission(
        "B",
        "int main() { return 0; }",
    ),
};

const identicalResult = compareSubmissionPair(
    identicalPair,
    0.70,
);

if (!identicalResult.exactMatch) {
    throw new Error(
        "Identical submissions should be an exact match.",
    );
}

if (identicalResult.structuralSimilarity !== 1) {
    throw new Error(
        "Identical submissions should have structural similarity 1.",
    );
}

if (!identicalResult.structuralSuspicious) {
    throw new Error(
        "Identical submissions should be structurally suspicious.",
    );
}

if (identicalResult.firstId !== "A") {
    throw new Error("First submission ID was not preserved.");
}

if (identicalResult.secondId !== "B") {
    throw new Error("Second submission ID was not preserved.");
}

console.log("PASS: identical pair comparison");

const differentPair: SubmissionPair = {
    first: createSubmission(
        "A",
        "int add(int a, int b) { return a + b; }",
    ),
    second: createSubmission(
        "B",
        "int multiply(int a, int b) { return a * b; }",
    ),
};

const differentResult = compareSubmissionPair(
    differentPair,
    1.0,
);

if (differentResult.exactMatch) {
    throw new Error(
        "Different submissions should not be an exact match.",
    );
}

if (differentResult.hashA === differentResult.hashB) {
    throw new Error(
        "Different submissions should have different hashes.",
    );
}

if (differentResult.structuralSimilarity <= 0) {
    throw new Error(
        "Related structural programs should have measurable similarity.",
    );
}

if (differentResult.structuralSimilarity >= 1) {
    throw new Error(
        "Different programs should not have structural similarity 1.",
    );
}

if (differentResult.structuralSuspicious) {
    throw new Error(
        "Similarity below the threshold should not be suspicious.",
    );
}

console.log("PASS: different pair comparison");

console.log("PASS: batch pair comparison");