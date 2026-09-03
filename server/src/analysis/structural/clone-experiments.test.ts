import { parseCpp } from "./cpp-parser.js";
import { structuralSequence } from "./traversal.js";
import { generateNGrams } from "./ngrams.js";
import { jaccardSimilarity } from "./similarity.js";

function similarityFor(
    firstSource: string,
    secondSource: string,
    ngramSize: number,
): number {
    const firstTree = parseCpp(firstSource);
    const secondTree = parseCpp(secondSource);

    const firstSequence = structuralSequence(firstTree.rootNode);
    const secondSequence = structuralSequence(secondTree.rootNode);

    const firstNGrams = generateNGrams(firstSequence, ngramSize);
    const secondNGrams = generateNGrams(secondSequence, ngramSize);

    return jaccardSimilarity(firstNGrams, secondNGrams);
}

function assert(
    name: string,
    condition: boolean,
    message: string,
): void {
    if (!condition) {
        throw new Error(`${name}: ${message}`);
    }

    console.log(`PASS: ${name}`);
}

const ngramSize = 3;

/*
 * Type-1 clone:
 * Same program, different formatting/comments.
 */
const type1A = `
int calculate(int a, int b) {
    return a + b;
}
`;

const type1B = `
int calculate(int a,int b)
{
    // formatting/comment change
    return a+b;
}
`;

const type1Similarity = similarityFor(
    type1A,
    type1B,
    ngramSize,
);

console.log(
    `Type-1 similarity: ${type1Similarity}`,
);

assert(
    "Type-1 clone",
    type1Similarity === 1,
    "Formatting/comment changes should preserve structural similarity.",
);

/*
 * Type-2 clone:
 * Identifiers and literal values are changed.
 */
const type2A = `
int calculate(int a, int b) {
    return a + b;
}
`;

const type2B = `
int compute(int first, int second) {
    return first + second;
}
`;

const type2Similarity = similarityFor(
    type2A,
    type2B,
    ngramSize,
);

console.log(
    `Type-2 similarity: ${type2Similarity}`,
);

assert(
    "Type-2 clone",
    type2Similarity === 1,
    "Identifier renaming should preserve structural similarity.",
);

/*
 * Selected Type-3 clone:
 * Additional structural logic is inserted.
 */
const type3A = `
int calculate(int a, int b) {
    return a + b;
}
`;

const type3B = `
int calculate(int a, int b) {
    int result = a + b;

    if (result > 0) {
        return result;
    }

    return 0;
}
`;

const type3Similarity = similarityFor(
    type3A,
    type3B,
    ngramSize,
);

console.log(
    `Type-3 similarity: ${type3Similarity}`,
);

assert(
    "Type-3 clone produces partial similarity",
    type3Similarity > 0 && type3Similarity < 1,
    "Inserted structural logic should preserve some, but not all, N-grams.",
);

/*
 * Unrelated programs:
 * A simple structurally different implementation.
 */
const unrelatedA = `
int calculate(int a, int b) {
    return a + b;
}
`;

const unrelatedB = `
int main() {
    int value = 0;

    while (value < 10) {
        value = value + 1;
    }

    return value;
}
`;

const unrelatedSimilarity = similarityFor(
    unrelatedA,
    unrelatedB,
    ngramSize,
);

console.log(
    `Unrelated similarity: ${unrelatedSimilarity}`,
);

assert(
    "Unrelated programs have lower similarity",
    unrelatedSimilarity < type3Similarity,
    "An unrelated structure should score below the selected Type-3 clone.",
);

console.log("PASS: controlled clone experiments");