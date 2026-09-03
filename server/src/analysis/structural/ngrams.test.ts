import { generateNGrams } from "./ngrams.js";

function assertEqual(
    name: string,
    actual: string[],
    expected: string[],
): void {
    if (actual.join("||") !== expected.join("||")) {
        throw new Error(
            `${name}: expected:\n` +
            `${expected.join("\n")}\n` +
            `but received:\n` +
            `${actual.join("\n")}`,
        );
    }

    console.log(`PASS: ${name}`);
}

const sequence = [
    "function_definition",
    "identifier",
    "parameter_list",
    "compound_statement",
    "return_statement",
];

assertEqual(
    "3-gram generation",
    generateNGrams(sequence, 3),
    [
        "function_definition|identifier|parameter_list",
        "identifier|parameter_list|compound_statement",
        "parameter_list|compound_statement|return_statement",
    ],
);

assertEqual(
    "2-gram generation",
    generateNGrams(sequence, 2),
    [
        "function_definition|identifier",
        "identifier|parameter_list",
        "parameter_list|compound_statement",
        "compound_statement|return_statement",
    ],
);

assertEqual(
    "N-gram larger than sequence",
    generateNGrams(sequence, 10),
    [],
);

assertEqual(
    "single-element N-grams",
    generateNGrams(["identifier"], 1),
    ["identifier"],
);

assertEqual(
    "duplicate elements are preserved",
    generateNGrams(
        ["identifier", "identifier", "return_statement"],
        2,
    ),
    [
        "identifier|identifier",
        "identifier|return_statement",
    ],
);

let invalidSizeRejected = false;

try {
    generateNGrams(sequence, 0);
} catch {
    invalidSizeRejected = true;
}

if (!invalidSizeRejected) {
    throw new Error("Invalid N-gram size was not rejected.");
}

console.log("PASS: invalid N-gram size is rejected");