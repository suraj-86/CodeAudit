import { structuralFingerprint } from "./fingerprint.js";

const sequence = [
  "function_definition",
  "identifier",
  "parameter_list",
  "compound_statement",
  "return_statement",
  "binary_expression",
  "identifier",
  "OPERATOR:+",
  "identifier",
];

const identicalSequence = [...sequence];

const differentSequence = [
  "function_definition",
  "identifier",
  "parameter_list",
  "compound_statement",
  "return_statement",
  "binary_expression",
  "identifier",
  "OPERATOR:-",
  "identifier",
];

const first = structuralFingerprint(sequence);
const second = structuralFingerprint(identicalSequence);
const different = structuralFingerprint(differentSequence);

if (first !== second) {
  throw new Error("Identical structural sequences produced different fingerprints.");
}

if (first === different) {
  throw new Error("Different structural sequences produced the same fingerprint.");
}

if (first.length !== 64) {
  throw new Error("Structural fingerprint is not a SHA-256 hexadecimal digest.");
}

console.log("PASS: identical structural sequences produce the same fingerprint");
console.log("PASS: different structural sequences produce different fingerprints");
console.log("PASS: structural fingerprint has expected SHA-256 length");