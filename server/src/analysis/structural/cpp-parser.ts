import { Language, Parser, Tree } from "web-tree-sitter";
import { getWasmPath } from "tree-sitter-wasm";

await Parser.init();

const cppLanguage = await Language.load(getWasmPath("cpp"));

const parser = new Parser();
parser.setLanguage(cppLanguage);

export function parseCpp(source: string): Tree {
    const tree = parser.parse(source);

    if (tree === null) {
        throw new Error("Tree-sitter returned no syntax tree.");
    }

    return tree;
}
