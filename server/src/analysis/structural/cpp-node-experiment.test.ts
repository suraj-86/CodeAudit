import { parseCpp } from "./cpp-parser.js";
import type { Node } from "web-tree-sitter";

const source = `
int calculate(int a, int b) {
    int result = a + b;

    if (result > 10) {
        result = result * 2;
    } else {
        result = result - 1;
    }

    return result;
}
`;

const tree = parseCpp(source);

function printNode(node: Node, depth = 0): void {
    const indent = "  ".repeat(depth);

    console.log(
        `${indent}${node.type} | named=${node.isNamed} | text=${JSON.stringify(node.text)}`,
    );

    for (let index = 0; index < node.childCount; index += 1) {
        const child = node.child(index);

        if (child !== null) {
            printNode(child, depth + 1);
        }
    }
}

console.log("C++ NODE EXPERIMENT");
console.log("===================");

printNode(tree.rootNode);