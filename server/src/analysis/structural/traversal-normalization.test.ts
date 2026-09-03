import { parseCpp } from "./cpp-parser.js";
import { structuralSequence } from "./traversal.js";

function sequenceFor(source: string): string[] {
    const tree = parseCpp(source);
    return structuralSequence(tree.rootNode);
}

function assertSame(
    name: string,
    a: string[],
    b: string[],
): void {
    if (a.join("|") !== b.join("|")) {
        throw new Error(
            `${name}: expected sequences to be identical.\n` +
            `A: ${a.join(" -> ")}\n` +
            `B: ${b.join(" -> ")}`,
        );
    }

    console.log(`PASS: ${name}`);
}

function assertDifferent(
    name: string,
    a: string[],
    b: string[],
): void {
    if (a.join("|") === b.join("|")) {
        throw new Error(
            `${name}: expected sequences to be different.`,
        );
    }

    console.log(`PASS: ${name}`);
}

const identifierA = `
int add(int a, int b) {
    return a + b;
}
`;

const identifierB = `
int sum(int first, int second) {
    return first + second;
}
`;

assertSame(
    "identifier renaming",
    sequenceFor(identifierA),
    sequenceFor(identifierB),
);

const operatorA = `
int calculate(int a, int b) {
    return a + b;
}
`;

const operatorB = `
int calculate(int a, int b) {
    return a * b;
}
`;

assertDifferent(
    "operator change",
    sequenceFor(operatorA),
    sequenceFor(operatorB),
);

const literalA = `
int calculate() {
    return 10 + 20;
}
`;

const literalB = `
int calculate() {
    return 30 + 40;
}
`;

assertSame(
    "literal value change",
    sequenceFor(literalA),
    sequenceFor(literalB),
);

const structureA = `
int calculate(int a, int b) {
    return a + b;
}
`;

const structureB = `
int calculate(int a, int b) {
    if (a > b) {
        return a;
    }

    return b;
}
`;

assertDifferent(
    "structural change",
    sequenceFor(structureA),
    sequenceFor(structureB),
);

const structuralA = `
int findMax(int a, int b) {
    if (a > b) {
        return a;
    } else {
        return b;
    }
}
`;

const structuralB = `
int getLargest(int first, int second) {
    if (first > second) {
        return first;
    } else {
        return second;
    }
}
`;

assertSame(
    "structural equivalence",
    sequenceFor(structuralA),
    sequenceFor(structuralB),
);

const commentsA = `
int calculate(int a, int b) {
    return a + b;
}
`;

const commentsB = `
int calculate(int a, int b) {
    // This comment should not affect structural similarity.
    return a + b;
}
`;

assertSame(
    "comments do not affect structural representation",
    sequenceFor(commentsA),
    sequenceFor(commentsB),
);