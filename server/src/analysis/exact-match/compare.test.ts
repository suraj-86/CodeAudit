import { compareFiles } from "./compare.js";

const sameA = Buffer.from("hello");
const sameB = Buffer.from("hello");
const different = Buffer.from("hello!");

const sameResult = compareFiles(sameA, sameB);

if (!sameResult.exactMatch) {
  throw new Error("Identical files were not detected as an exact match.");
}

if (sameResult.hashA !== sameResult.hashB) {
  throw new Error("Identical files produced different hashes.");
}

const differentResult = compareFiles(sameA, different);

if (differentResult.exactMatch) {
  throw new Error("Different files were incorrectly detected as an exact match.");
}

if (differentResult.hashA === differentResult.hashB) {
  throw new Error("Different files produced the same hash.");
}

console.log("PASS: identical files are exact matches");
console.log("PASS: different files are not exact matches");
console.log("PASS: comparison returns SHA-256 hashes");