import type { Tree } from "web-tree-sitter";
import { parseSource } from "./source-parser.js";

/**
 * A C++-specific convenience wrapper over the generic parser (see
 * source-parser.ts), kept so existing C++-specific tests and call sites
 * don't need to name the language as a string.
 */
export function parseCpp(source: string): Tree {
    return parseSource(source, "cpp");
}
