import { calculateSha256 } from "./hash.js";

const helloHash =
  "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824";

const first = calculateSha256(Buffer.from("hello"));
const second = calculateSha256(Buffer.from("hello"));
const different = calculateSha256(Buffer.from("hello!"));

if (first !== helloHash) {
  throw new Error("SHA-256 hash does not match expected value.");
}

if (first !== second) {
  throw new Error("Identical content produced different hashes.");
}

if (first === different) {
  throw new Error("Different content produced the same hash.");
}

console.log("PASS: SHA-256 hashing");
console.log("PASS: identical content is deterministic");
console.log("PASS: different content produces a different hash");