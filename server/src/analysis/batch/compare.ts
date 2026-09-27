import { compareFiles } from "../exact-match/compare.js";
import { parseCpp } from "../structural/cpp-parser.js";
import { structuralSequence } from "../structural/traversal.js";
import { compareStructuralSequences } from "../structural/compare.js";
import type { SubmissionPair } from "./pairs.js";

export interface BatchPairComparison {
    firstId: string;
    secondId: string;
    exactMatch: boolean;
    hashA: string;
    hashB: string;
    structuralSimilarity: number | null;
    structuralThreshold: number;
    structuralSuspicious: boolean;
    structuralUnsupportedReason?: string;
}

/**
 * Structural (AST) comparison currently supports C++ only, matching the
 * boundary already enforced in ./reference.ts. A pair is only eligible
 * for structural comparison when both submissions are C++; otherwise the
 * pair is still exact-matched, but structural similarity is reported as
 * unavailable rather than silently parsed as C++.
 */
function isStructurallySupported(
    pair: SubmissionPair,
): boolean {
    return (
        pair.first.language.toLowerCase() === "cpp" &&
        pair.second.language.toLowerCase() === "cpp"
    );
}

export function compareSubmissionPair(
    pair: SubmissionPair,
    structuralThreshold: number,
): BatchPairComparison {
    const exactResult = compareFiles(
        pair.first.source,
        pair.second.source,
    );

    if (!isStructurallySupported(pair)) {
        return {
            firstId: pair.first.id,
            secondId: pair.second.id,
            exactMatch: exactResult.exactMatch,
            hashA: exactResult.hashA,
            hashB: exactResult.hashB,
            structuralSimilarity: null,
            structuralThreshold,
            structuralSuspicious: false,
            structuralUnsupportedReason:
                "Structural comparison currently supports C++ submissions only.",
        };
    }

    const firstSource = pair.first.source.toString("utf8");
    const secondSource = pair.second.source.toString("utf8");

    const firstTree = parseCpp(firstSource);
    const secondTree = parseCpp(secondSource);

    const firstSequence = structuralSequence(
        firstTree.rootNode,
    );

    const secondSequence = structuralSequence(
        secondTree.rootNode,
    );

    const structuralResult = compareStructuralSequences(
        firstSequence,
        secondSequence,
        structuralThreshold,
    );

    return {
        firstId: pair.first.id,
        secondId: pair.second.id,
        exactMatch: exactResult.exactMatch,
        hashA: exactResult.hashA,
        hashB: exactResult.hashB,
        structuralSimilarity: structuralResult.similarity,
        structuralThreshold: structuralResult.threshold,
        structuralSuspicious: structuralResult.suspicious,
    };
}