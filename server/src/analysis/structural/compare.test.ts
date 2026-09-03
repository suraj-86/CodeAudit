import { compareStructuralSequences } from "./compare.js";

const identical = compareStructuralSequences(
    ["A", "B", "C"],
    ["A", "B", "C"],
    0.70,
);

if (identical.similarity !== 1) {
    throw new Error("Identical sequences should have similarity 1.");
}

if (!identical.suspicious) {
    throw new Error("Similarity above threshold should be suspicious.");
}

const partial = compareStructuralSequences(
    ["A", "B", "C"],
    ["B", "C", "D"],
    0.70,
);

if (partial.similarity !== 0.5) {
    throw new Error("Partial overlap should produce similarity 0.5.");
}

if (partial.suspicious) {
    throw new Error("Similarity below threshold should not be suspicious.");
}

const exactThreshold = compareStructuralSequences(
    ["A", "B"],
    ["A", "B"],
    1,
);

if (!exactThreshold.suspicious) {
    throw new Error("Similarity equal to threshold should be suspicious.");
}

console.log("PASS: structural sequence comparison");

let invalidThresholdRejected = false;

try {
    compareStructuralSequences(
        ["A"],
        ["A"],
        1.1,
    );
} catch {
    invalidThresholdRejected = true;
}

if (!invalidThresholdRejected) {
    throw new Error("Invalid similarity threshold was not rejected.");
}

console.log("PASS: invalid similarity threshold is rejected");