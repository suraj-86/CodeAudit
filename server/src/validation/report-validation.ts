import type { ReportInput } from "../reporting/report-input.js";

export interface ReportValidationResult {
  valid: boolean;
  reason?: string;
}

export function validateReportInput(
  input: unknown,
): ReportValidationResult {
  if (!input || typeof input !== "object") {
    return {
      valid: false,
      reason: "Report input must be an object.",
    };
  }

  const report = input as Partial<ReportInput>;

  if (!Array.isArray(report.sourceFiles)) {
    return {
      valid: false,
      reason: "Source files must be provided as an array.",
    };
  }

  if (report.sourceFiles.length === 0) {
    return {
      valid: false,
      reason: "At least one source file is required.",
    };
  }

  for (const file of report.sourceFiles) {
    if (!file || typeof file !== "object") {
      return {
        valid: false,
        reason: "Each source file must be an object.",
      };
    }

    if (
      typeof file.filename !== "string" ||
      !file.filename.trim()
    ) {
      return {
        valid: false,
        reason: "Each source file must have a filename.",
      };
    }

    if (
      file.language !== undefined &&
      typeof file.language !== "string"
    ) {
      return {
        valid: false,
        reason: "Source file language must be a string.",
      };
    }

    if (
      file.sha256 !== undefined &&
      typeof file.sha256 !== "string"
    ) {
      return {
        valid: false,
        reason: "Source file SHA-256 must be a string.",
      };
    }
  }

  if (
    report.projectName !== undefined &&
    typeof report.projectName !== "string"
  ) {
    return {
      valid: false,
      reason: "Project name must be a string.",
    };
  }

  if (
    report.generatedAt !== undefined &&
    typeof report.generatedAt !== "string"
  ) {
    return {
      valid: false,
      reason: "Generated timestamp must be a string.",
    };
  }

  return {
    valid: true,
  };
}