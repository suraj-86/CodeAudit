import { isExactMatch } from "./exact-match.js";

const hashA =
  "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824";

const hashB =
  "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824";

const hashC =
  "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08";

if (!isExactMatch(hashA, hashB)) {
  throw new Error("Identical hashes were not detected as an exact match.");
}

if (isExactMatch(hashA, hashC)) {
  throw new Error("Different hashes were incorrectly detected as an exact match.");
}

console.log("PASS: identical hashes are exact matches");
console.log("PASS: different hashes are not exact matches");