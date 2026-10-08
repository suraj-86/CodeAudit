import { SUPPORTED_LANGUAGES } from "./limits.js";

export type LanguageId = keyof typeof SUPPORTED_LANGUAGES;

export interface LanguageCapabilities {
    exactMatch: boolean;
    structural: boolean;
    batch: boolean;
    execution: boolean;
    ai: boolean;
}

const CAPABILITIES: Record<LanguageId, LanguageCapabilities> = {
    python: {
        exactMatch: true,
        structural: true,
        batch: true,
        execution: true,
        ai: true,
    },
    c: {
        exactMatch: true,
        structural: true,
        batch: true,
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
        structural: true,
        batch: true,
        execution: false,
        ai: true,
    },
    javascript: {
        exactMatch: true,
        structural: true,
        batch: true,
        execution: false,
        ai: true,
    },
    typescript: {
        exactMatch: true,
        structural: true,
        batch: true,
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
