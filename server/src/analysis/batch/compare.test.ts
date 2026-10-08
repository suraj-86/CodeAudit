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

if (differentResult.structuralSimilarity === null) {
    throw new Error(
        "Same-language pairs should always receive a structural similarity value.",
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

const mixedLanguagePair: SubmissionPair = {
    first: createSubmission(
        "A",
        "int main() { return 0; }",
    ),
    second: {
        id: "B",
        name: "B.py",
        language: "python",
        source: Buffer.from(
            "print('hello')",
            "utf8",
        ),
    },
};

const mixedLanguageResult = compareSubmissionPair(
    mixedLanguagePair,
    0.70,
);

if (mixedLanguageResult.structuralSimilarity !== null) {
    throw new Error(
        "Pairs in different languages must not receive a fabricated structural similarity value.",
    );
}

if (mixedLanguageResult.structuralSuspicious) {
    throw new Error(
        "Pairs in different languages must never be flagged as structurally suspicious.",
    );
}

if (
    !mixedLanguageResult.structuralUnsupportedReason
        ?.toLowerCase()
        .includes("same language")
) {
    throw new Error(
        "A cross-language pair must explain that both sides need to be the same language.",
    );
}

if (typeof mixedLanguageResult.exactMatch !== "boolean") {
    throw new Error(
        "Exact-match must still be computed regardless of structural support.",
    );
}

console.log(
    "PASS: pairs in different languages skip structural comparison instead of being misparsed",
);

const unsupportedLanguagePair: SubmissionPair = {
    first: {
        id: "A",
        name: "A.cobol",
        language: "cobol",
        source: Buffer.from("DISPLAY 'HELLO'.", "utf8"),
    },
    second: {
        id: "B",
        name: "B.cobol",
        language: "cobol",
        source: Buffer.from("DISPLAY 'WORLD'.", "utf8"),
    },
};

const unsupportedLanguageResult = compareSubmissionPair(
    unsupportedLanguagePair,
    0.70,
);

if (unsupportedLanguageResult.structuralSimilarity !== null) {
    throw new Error(
        "A genuinely unsupported language must not receive a fabricated structural similarity value.",
    );
}

if (
    !unsupportedLanguageResult.structuralUnsupportedReason
        ?.toLowerCase()
        .includes("not supported")
) {
    throw new Error(
        "A genuinely unsupported language must be named as the specific reason, not blamed on a language mismatch.",
    );
}

console.log(
    "PASS: a genuinely unsupported language reports why, rather than a same-language message",
);