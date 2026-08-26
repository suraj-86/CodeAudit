import { parseCpp } from "./cpp-parser.js";

const source = `
int add(int a, int b) {
    return a + b;
}
`;

const tree = parseCpp(source);

if (tree.rootNode.type !== "translation_unit") {
    throw new Error(
        `Expected translation_unit, got ${tree.rootNode.type}`
    );
}

if (tree.rootNode.hasError) {
    throw new Error("Tree-sitter reported a syntax error.");
}

console.log("PASS: C++ source parsed successfully");
console.log("ROOT TYPE:", tree.rootNode.type);
console.log("HAS ERROR:", tree.rootNode.hasError);