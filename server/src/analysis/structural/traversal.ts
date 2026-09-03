import type { Node } from "web-tree-sitter";

const STRUCTURAL_OPERATORS = new Set([
    "+",
    "-",
    "*",
    "/",
    "%",
    ">",
    "<",
    ">=",
    "<=",
    "==",
    "!=",
    "=",
]);

export function structuralSequence(root: Node): string[] {
        const sequence: string[] = [];

    function traverse(node: Node): void {
        if (node.type === "comment") {
    return;
}

if (node.isNamed) {
    sequence.push(node.type);
} else if (STRUCTURAL_OPERATORS.has(node.type)) {
    sequence.push(`OPERATOR:${node.type}`);
}

        for (let index = 0; index < node.childCount; index += 1) {
            const child = node.child(index);

            if (child !== null) {
                traverse(child);
            }
        }
    }

    traverse(root);

    return sequence;
}