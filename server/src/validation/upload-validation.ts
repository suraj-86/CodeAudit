import { UPLOAD_LIMITS } from "../config/limits.js";

export interface UploadValidationResult {
  valid: boolean;
  reason?: string;
}

export function validateTotalUploadSize(
  fileSizes: readonly number[],
): UploadValidationResult {
  const totalSize = fileSizes.reduce(
    (total, size) => total + size,
    0,
  );

  if (totalSize > UPLOAD_LIMITS.maxTotalSourceBytes) {
    return {
      valid: false,
      reason: "Total upload size exceeds the maximum allowed limit.",
    };
  }

  return {
    valid: true,
  };
}