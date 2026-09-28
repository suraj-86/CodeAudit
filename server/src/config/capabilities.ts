import { SUPPORTED_LANGUAGES } from "./limits.js";

export type LanguageId = keyof typeof SUPPORTED_LANGUAGES;

export interface LanguageCapabilities {
    /** SHA-256 exact-match comparison. Works on raw bytes for any language. */
    exactMatch: boolean;
    /** AST structural similarity (Tree-sitter). */
    structural: boolean;
    /** Batch / reference comparison across many submissions. */
    batch: boolean;
    /** Sandboxed execution against test cases (correctness). */
    execution: boolean;
    /** AI-assisted analysis. Language-agnostic. */
    ai: boolean;
}

/**
 * The single source of truth for which analysis engines actually support
 * which language. The integration layer (workflow orchestrator, batch
 * route) and `GET /api/languages` both read from here, so the frontend
 * can never drift from what the backend enforces.
 *
 * Only flip a flag to true when the underlying engine really implements
 * that language — these flags describe engines, they don't create them.
 * (The low-level engines keep their own guards as defense in depth.)
 */
const CAPABILITIES: Record<LanguageId, LanguageCapabilities> = {
    python: {
        exactMatch: true,
        structural: false,
        batch: false,
        execution: true,
        ai: true,
    },
    c: {
        exactMatch: true,
        structural: false,
        batch: false,
        execution: false,
        ai: true,
    },
    cpp: {
        exactMatch: true,
        structural: true,
        batch: true,
        execution: false,
        ai: true,
    },
    java: {
        exactMatch: true,
        structural: false,
        batch: false,
        execution: false,
        ai: true,
    },
    javascript: {
        exactMatch: true,
        structural: false,
        batch: false,
        execution: false,
        ai: true,
    },
    typescript: {
        exactMatch: true,
        structural: false,
        batch: false,
        execution: false,
        ai: true,
    },
};

export function getLanguageCapabilities(
    language: string,
): LanguageCapabilities | undefined {
    const id = language.trim().toLowerCase();

    return Object.prototype.hasOwnProperty.call(CAPABILITIES, id)
        ? CAPABILITIES[id as LanguageId]
        : undefined;
}

export function supportsCapability(
    language: string,
    capability: keyof LanguageCapabilities,
): boolean {
    return getLanguageCapabilities(language)?.[capability] ?? false;
}
