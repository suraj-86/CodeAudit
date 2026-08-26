import { parseCpp } from "./cpp-parser.js";
import { structuralSequence } from "./traversal.js";

const source = `
int add(int a, int b) {
    return a + b;
}
`;

const tree = parseCpp(source);
const sequence = structuralSequence(tree.rootNode);

console.log("STRUCTURAL SEQUENCE:");
console.log(sequence.join(" -> "));

if (!sequence.includes("function_definition")) {
    throw new Error("Expected function_definition in structural sequence.");
}

if (!sequence.includes("OPERATOR:+")) {
    throw new Error("Expected addition operator in structural sequence.");
}

if (sequence.includes("a") || sequence.includes("b")) {
    throw new Error("Identifier values must not appear in structural sequence.");
}

console.log("PASS: structural traversal");