import type { BatchPairComparison } from "./compare.js";
import type { PairwiseMatrix } from "./matrix.js";
import { rankSuspiciousPairs } from "./ranking.js";

const comparisons: BatchPairComparison[] = [
    {
        firstId: "A",
        secondId: "B",
        exactMatch: false,
        hashA: "hash-a",
        hashB: "hash-b",
        structuralSimilarity: 0.82,
        structuralThreshold: 0.70,
        structuralSuspicious: true,
    },
    {
        firstId: "A",
        secondId: "C",
        exactMatch: false,
        hashA: "hash-a",
        hashB: "hash-c",
        structuralSimilarity: 0.45,
        structuralThreshold: 0.70,
        structuralSuspicious: false,
    },
    {
        firstId: "B",
        secondId: "C",
        exactMatch: false,
        hashA: "hash-b",
        hashB: "hash-c",
        structuralSimilarity: 0.94,
        structuralThreshold: 0.70,
        structuralSuspicious: true,
    },
];

const matrix: PairwiseMatrix = {
    submissionIds: ["A", "B", "C"],
    comparisons,
};

const ranked = rankSuspiciousPairs(matrix);

if (ranked.length !== 2) {
    throw new Error(
        "Only suspicious pairs should be included in the ranking.",
    );
}

console.log("PASS: suspicious pairs are filtered");

if (
    ranked[0]?.firstId !== "B" ||
    ranked[0]?.secondId !== "C"
) {
    throw new Error(
        "Highest-similarity suspicious pair should rank first.",
    );
}

console.log("PASS: suspicious pairs are ranked by similarity");

if (
    ranked[1]?.firstId !== "A" ||
    ranked[1]?.secondId !== "B"
) {
    throw new Error(
        "Lower-similarity suspicious pair should rank second.",
    );
}

console.log("PASS: ranking order is descending");

if (ranked.some(
    (comparison) => !comparison.structuralSuspicious,
)) {
    throw new Error(
        "Non-suspicious pairs must not appear in the ranking.",
    );
}

console.log("PASS: non-suspicious pairs are excluded");

console.log("PASS: suspicious-pair ranking");