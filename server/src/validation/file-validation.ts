import { extname } from "node:path";

import { SUPPORTED_LANGUAGES } from "../config/limits.js";

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

export interface FileValidationResult {
  valid: boolean;
  reason?: string;
}

export function validateFileLanguage(
  filename: string,
  language: string,
): FileValidationResult {
  const normalizedLanguage = language.trim().toLowerCase();

  if (!(normalizedLanguage in SUPPORTED_LANGUAGES)) {
    return {
      valid: false,
      reason: "Unsupported programming language.",
    };
  }

  const extension = extname(filename).toLowerCase();

  if (!extension) {
    return {
      valid: false,
      reason: "File must have a supported source-code extension.",
    };
  }

  const languageConfig =
    SUPPORTED_LANGUAGES[
      normalizedLanguage as SupportedLanguage
    ];

  const supportedExtensions: readonly string[] =
    languageConfig.extensions;

  if (!supportedExtensions.includes(extension)) {
    return {
      valid: false,
      reason: `File extension "${extension}" does not match the selected language.`,
    };
  }

  return {
    valid: true,
  };
}