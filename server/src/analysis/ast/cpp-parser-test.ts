import { Language, Node, Parser } from "web-tree-sitter";
import { getWasmPath } from "tree-sitter-wasm";

await Parser.init();

const parser = new Parser();

const cppLanguage = await Language.load(getWasmPath("cpp"));
parser.setLanguage(cppLanguage);

const operators = new Set([
    "+",
    "-",
    "*",
    "/",
    "%",
    "==",
    "!=",
    "<",
    ">",
    "<=",
    ">=",
    "&&",
    "||",
    "=",
]);

function structuralSequence(source: string): string[] {
    const tree = parser.parse(source);

    if (tree === null) {
        throw new Error("Tree-sitter returned no syntax tree.");
    }

    const sequence: string[] = [];

    function traverse(node: Node): void {
        if (node.isNamed) {
            sequence.push(node.type);
        } else if (operators.has(node.type)) {
            sequence.push(`OPERATOR:${node.type}`);
        }

        for (let index = 0; index < node.childCount; index += 1) {
            const child = node.child(index);

            if (child !== null) {
                traverse(child);
            }
        }
    }

    traverse(tree.rootNode);

    return sequence;
}

const sourceA = `
int add(int a, int b) {
    return a + b;
}
`;

const sourceB = `
int sum(int first, int second) {
    return first + second;
}
`;

const sourceC = `
int calculate(int a, int b) {
    return a + b;
}
`;

const sourceD = `
int calculate(int a, int b) {
    return a * b;
}
`;

const sourceE = `
int calculate() {
    return 10 + 20;
}
`;

const sourceF = `
int calculate() {
    return 30 + 40;
}
`;

const sequenceA = structuralSequence(sourceA);
const sequenceB = structuralSequence(sourceB);
const sequenceC = structuralSequence(sourceC);
const sequenceD = structuralSequence(sourceD);
const sequenceE = structuralSequence(sourceE);
const sequenceF = structuralSequence(sourceF);

function compare(
    nameA: string,
    sequenceA: string[],
    nameB: string,
    sequenceB: string[],
): void {
    const equal = JSON.stringify(sequenceA) === JSON.stringify(sequenceB);

    console.log(`\n${nameA} vs ${nameB}: ${equal ? "SAME" : "DIFFERENT"}`);

    if (!equal) {
        console.log(`${nameA}:`);
        console.log(sequenceA.join(" -> "));

        console.log(`${nameB}:`);
        console.log(sequenceB.join(" -> "));
    }
}

compare("A", sequenceA, "B", sequenceB);
compare("C", sequenceC, "D", sequenceD);
compare("E", sequenceE, "F", sequenceF);
