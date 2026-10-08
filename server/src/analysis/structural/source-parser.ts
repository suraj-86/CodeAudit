import { Language, Parser, Tree } from "web-tree-sitter";
import { getWasmPath } from "tree-sitter-wasm";

await Parser.init();

/**
 * Languages the structural (AST) engine supports. This list is the
 * actual implementation boundary; config/capabilities.ts's `structural`
 * flags must match it exactly — see that file's own comment.
 *
 * Grammars are loaded eagerly, once, at module init (not lazily per
 * request): there are only six small wasm files, so the startup cost is
 * negligible, and it keeps parseSource() synchronous, matching every
 * existing call site's expectations.
 */
const STRUCTURAL_LANGUAGES = [
    "c",
    "cpp",
    "java",
    "javascript",
    "typescript",
    "python",
] as const;

export type StructuralLanguage = (typeof STRUCTURAL_LANGUAGES)[number];

const parsers = new Map<StructuralLanguage, Parser>();

for (const language of STRUCTURAL_LANGUAGES) {
    const grammar = await Language.load(getWasmPath(language));
    const parser = new Parser();
    parser.setLanguage(grammar);
    parsers.set(language, parser);
}

export function isStructuralLanguage(
    language: string,
): language is StructuralLanguage {
    return (STRUCTURAL_LANGUAGES as readonly string[]).includes(
        language.toLowerCase(),
    );
}

/**
 * Parses source code with the Tree-sitter grammar for `language`
 * (case-insensitive). Throws for any language outside
 * STRUCTURAL_LANGUAGES — callers should check isStructuralLanguage()
 * (or, in the HTTP layer, the capabilities system) first, the same way
 * every other unsupported-language boundary in this codebase is
 * enforced explicitly rather than left to fail inside the engine.
 */
export function parseSource(source: string, language: string): Tree {
    const normalized = language.toLowerCase();

    if (!isStructuralLanguage(normalized)) {
        throw new Error(
            `Structural parsing is not supported for language "${language}".`,
        );
    }

    const parser = parsers.get(normalized);

    if (!parser) {
        throw new Error(
            `No parser was loaded for language "${language}".`,
        );
    }

    const tree = parser.parse(source);

    if (tree === null) {
        throw new Error("Tree-sitter returned no syntax tree.");
    }

    return tree;
}
