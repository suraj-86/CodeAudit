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
    structuralSimilarity: number;
    structuralThreshold: number;
    structuralSuspicious: boolean;
}

export function compareSubmissionPair(
    pair: SubmissionPair,
    structuralThreshold: number,
): BatchPairComparison {
    const exactResult = compareFiles(
        pair.first.source,
        pair.second.source,
    );

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