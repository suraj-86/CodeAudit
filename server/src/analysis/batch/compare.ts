import { compareFiles } from "../exact-match/compare.js";
import { parseSource } from "../structural/source-parser.js";
import { structuralSequence } from "../structural/traversal.js";
import { compareStructuralSequences } from "../structural/compare.js";
import { supportsCapability } from "../../config/capabilities.js";
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
 * Structural (AST) comparison is available for every language the
 * capabilities system marks `structural: true` (see config/capabilities.ts
 * and Decision 050), matching the boundary enforced in ./reference.ts. A
 * pair is only eligible when both submissions support structural analysis
 * AND are the same language; otherwise the pair is still exact-matched,
 * but structural similarity is reported as unavailable rather than
 * silently parsed as if both sides shared a grammar.
 */
function isStructurallySupported(
    pair: SubmissionPair,
): boolean {
    return (
        supportsCapability(pair.first.language, "structural") &&
        supportsCapability(pair.second.language, "structural") &&
        pair.first.language.toLowerCase() ===
            pair.second.language.toLowerCase()
    );
}

function structuralUnsupportedReason(
    pair: SubmissionPair,
): string {
    // Checked in this order deliberately: a genuinely unsupported
    // language is the more specific, more useful reason — naming it
    // even when the pair also happens to be cross-language avoids the
    // misleading implication that matching languages would be enough.
    if (!supportsCapability(pair.first.language, "structural")) {
        return `Structural comparison is not supported for "${pair.first.language}" yet.`;
    }

    if (!supportsCapability(pair.second.language, "structural")) {
        return `Structural comparison is not supported for "${pair.second.language}" yet.`;
    }

    return "Structural comparison requires both submissions to be the same language.";
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
                structuralUnsupportedReason(pair),
        };
    }

    const firstSource = pair.first.source.toString("utf8");
    const secondSource = pair.second.source.toString("utf8");

    const firstTree = parseSource(firstSource, pair.first.language);
    const secondTree = parseSource(secondSource, pair.second.language);

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