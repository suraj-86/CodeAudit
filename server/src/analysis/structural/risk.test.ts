import { classifySimilarityRisk } from "./risk.js";

const thresholds = {
    moderate: 0.50,
    high: 0.70,
    veryHigh: 0.90,
};

if (
    classifySimilarityRisk(0.20, thresholds) !== "Low"
) {
    throw new Error("Low similarity was not classified correctly.");
}

if (
    classifySimilarityRisk(0.50, thresholds) !== "Moderate"
) {
    throw new Error("Moderate threshold was not classified correctly.");
}

if (
    classifySimilarityRisk(0.70, thresholds) !== "High"
) {
    throw new Error("High threshold was not classified correctly.");
}

if (
    classifySimilarityRisk(0.90, thresholds) !== "Very High"
) {
    throw new Error("Very High threshold was not classified correctly.");
}

let invalidSimilarityRejected = false;

try {
    classifySimilarityRisk(1.1, thresholds);
} catch {
    invalidSimilarityRejected = true;
}

if (!invalidSimilarityRejected) {
    throw new Error("Invalid similarity value was not rejected.");
}

let invalidThresholdRejected = false;

try {
    classifySimilarityRisk(0.80, {
        moderate: 0.50,
        high: 0.70,
        veryHigh: 1.1,
    });
} catch {
    invalidThresholdRejected = true;
}

if (!invalidThresholdRejected) {
    throw new Error("Invalid risk threshold was not rejected.");
}

let invalidOrderingRejected = false;

try {
    classifySimilarityRisk(0.80, {
        moderate: 0.70,
        high: 0.60,
        veryHigh: 0.90,
    });
} catch {
    invalidOrderingRejected = true;
}

if (!invalidOrderingRejected) {
    throw new Error("Invalid threshold ordering was not rejected.");
}

console.log("PASS: Low similarity risk classification");
console.log("PASS: Moderate similarity risk classification");
console.log("PASS: High similarity risk classification");
console.log("PASS: Very High similarity risk classification");
console.log("PASS: invalid similarity is rejected");
console.log("PASS: invalid risk threshold is rejected");
console.log("PASS: invalid threshold ordering is rejected");