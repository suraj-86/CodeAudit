import { jaccardSimilarity } from "./similarity.js";

function assertEqual(
    name: string,
    actual: number,
    expected: number,
): void {
    if (actual !== expected) {
        throw new Error(
            `${name}: expected ${expected}, received ${actual}.`,
        );
    }

    console.log(`PASS: ${name}`);
}

assertEqual(
    "identical sequences have Jaccard similarity 1",
    jaccardSimilarity(
        ["A", "B", "C"],
        ["A", "B", "C"],
    ),
    1,
);

assertEqual(
    "disjoint sequences have Jaccard similarity 0",
    jaccardSimilarity(
        ["A", "B"],
        ["C", "D"],
    ),
    0,
);

assertEqual(
    "partial overlap produces expected Jaccard similarity",
    jaccardSimilarity(
        ["A", "B", "C"],
        ["B", "C", "D"],
    ),
    0.5,
);

assertEqual(
    "duplicate elements do not affect set-based Jaccard",
    jaccardSimilarity(
        ["A", "A", "B"],
        ["A", "B", "C"],
    ),
    2 / 3,
);

assertEqual(
    "empty sequences produce zero similarity",
    jaccardSimilarity(
        [],
        [],
    ),
    0,
);

assertEqual(
    "one empty sequence produces zero similarity",
    jaccardSimilarity(
        ["A"],
        [],
    ),
    0,
);

console.log("PASS: Jaccard similarity tests");