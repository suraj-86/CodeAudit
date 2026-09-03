
import type { StructuralSimilarityResult } from "./similarity-result.js";

const result: StructuralSimilarityResult = {
    similarity: 0.75,
    threshold: 0.70,
    suspicious: true,
};

if (result.similarity !== 0.75) {
    throw new Error("Similarity value was not preserved.");
}

if (result.threshold !== 0.70) {
    throw new Error("Threshold value was not preserved.");
}

if (result.suspicious !== true) {
    throw new Error("Suspicious flag was not preserved.");
}

console.log("PASS: structural similarity result model");