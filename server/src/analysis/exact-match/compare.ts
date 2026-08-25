import { calculateSha256 } from "./hash.js";
import { isExactMatch } from "./exact-match.js";

export function compareFiles(
  fileA: Buffer,
  fileB: Buffer,
) {
  const hashA = calculateSha256(fileA);
  const hashB = calculateSha256(fileB);

  return {
    hashA,
    hashB,
    exactMatch: isExactMatch(hashA, hashB),
  };
}