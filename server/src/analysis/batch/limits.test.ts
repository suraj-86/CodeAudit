import { validateBatchSize } from "./limits.js";

validateBatchSize(1);
console.log("PASS: minimum batch size");

validateBatchSize(100);
console.log("PASS: maximum batch size");

let zeroRejected = false;

try {
    validateBatchSize(0);
} catch {
    zeroRejected = true;
}

if (!zeroRejected) {
    throw new Error("Zero batch size was not rejected.");
}

console.log("PASS: zero batch size is rejected");

let negativeRejected = false;

try {
    validateBatchSize(-1);
} catch {
    negativeRejected = true;
}

if (!negativeRejected) {
    throw new Error("Negative batch size was not rejected.");
}

console.log("PASS: negative batch size is rejected");

let decimalRejected = false;

try {
    validateBatchSize(10.5);
} catch {
    decimalRejected = true;
}

if (!decimalRejected) {
    throw new Error("Decimal batch size was not rejected.");
}

console.log("PASS: decimal batch size is rejected");

let excessiveRejected = false;

try {
    validateBatchSize(101);
} catch {
    excessiveRejected = true;
}

if (!excessiveRejected) {
    throw new Error("Batch exceeding the limit was not rejected.");
}

console.log("PASS: excessive batch size is rejected");

console.log("PASS: batch limit tests");