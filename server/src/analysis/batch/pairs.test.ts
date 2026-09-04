import type { BatchSubmission } from "./submission.js";
import { generateSubmissionPairs } from "./pairs.js";

function createSubmission(id: string): BatchSubmission {
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

const submissions = [
    createSubmission("A"),
    createSubmission("B"),
    createSubmission("C"),
];

const pairs = generateSubmissionPairs(submissions);

if (pairs.length !== 3) {
    throw new Error(
        `Three submissions should produce three pairs, received ${pairs.length}.`,
    );
}

console.log("PASS: three submissions produce three pairs");

const pairIds = pairs.map(
    (pair) => `${pair.first.id}-${pair.second.id}`,
);

const expected = [
    "A-B",
    "A-C",
    "B-C",
];

if (JSON.stringify(pairIds) !== JSON.stringify(expected)) {
    throw new Error(
        `Unexpected pair generation: ${JSON.stringify(pairIds)}`,
    );
}

console.log("PASS: unique submission pairs are generated");

const single = generateSubmissionPairs([
    createSubmission("A"),
]);

if (single.length !== 0) {
    throw new Error("One submission should produce zero pairs.");
}

console.log("PASS: single submission produces zero pairs");

const empty = generateSubmissionPairs([]);

if (empty.length !== 0) {
    throw new Error("Empty submission list should produce zero pairs.");
}

console.log("PASS: empty submission list produces zero pairs");

const fourSubmissions = [
    createSubmission("A"),
    createSubmission("B"),
    createSubmission("C"),
    createSubmission("D"),
];

const fourPairs = generateSubmissionPairs(fourSubmissions);

if (fourPairs.length !== 6) {
    throw new Error(
        `Four submissions should produce six pairs, received ${fourPairs.length}.`,
    );
}

console.log("PASS: four submissions produce six pairs");

console.log("PASS: submission pair generation");