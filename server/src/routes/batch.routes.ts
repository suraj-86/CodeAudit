import { randomUUID } from "node:crypto";

import { Router } from "express";

import { upload } from "../config/upload.js";
import { UPLOAD_LIMITS } from "../config/limits.js";
import { validateFileLanguage } from "../validation/file-validation.js";
import { validateTotalUploadSize } from "../validation/upload-validation.js";
import { uploadRateLimiter } from "../middleware/rate-limit.js";

import { analyzeBatch } from "../analysis/batch/orchestrator.js";
import type { BatchSubmission } from "../analysis/batch/submission.js";

const router = Router();

const DEFAULT_STRUCTURAL_THRESHOLD = 0.75;

router.post(
    "/analyze/batch",
    uploadRateLimiter,
    upload.fields([
        {
            name: "submissions",
            maxCount: UPLOAD_LIMITS.batch.maxSubmissions,
        },
        { name: "reference", maxCount: 1 },
    ]),
    (req, res) => {
        const files = req.files as
            | { [fieldname: string]: Express.Multer.File[] }
            | undefined;

        const submissionFiles = files?.submissions ?? [];
        const referenceFile = files?.reference?.[0];
        const body = (req.body ?? {}) as Record<string, unknown>;

        const language =
            typeof body.language === "string"
                ? body.language.trim().toLowerCase()
                : "";

        if (!language) {
            return res.status(400).json({
                error: {
                    code: "LANGUAGE_REQUIRED",
                    message:
                        "A programming language must be specified for the batch.",
                    details: null,
                },
            });
        }

        if (submissionFiles.length === 0) {
            return res.status(400).json({
                error: {
                    code: "SUBMISSIONS_REQUIRED",
                    message:
                        "At least one submission is required under the \"submissions\" field.",
                    details: null,
                },
            });
        }

        if (!referenceFile) {
            return res.status(400).json({
                error: {
                    code: "REFERENCE_REQUIRED",
                    message:
                        "A reference solution is required under the \"reference\" field.",
                    details: null,
                },
            });
        }

        /*
         * analysis/batch/reference.ts hard-requires C++ for both the
         * reference and every submission. Surfacing that as a clear 400
         * here (rather than letting it throw into a 500 further down)
         * documents the same boundary Phase 6 already established.
         */
        if (language !== "cpp") {
            return res.status(400).json({
                error: {
                    code: "UNSUPPORTED_LANGUAGE",
                    message:
                        "Batch/reference structural analysis currently supports C++ submissions only.",
                    details: null,
                },
            });
        }

        const allFiles = [...submissionFiles, referenceFile];
        const invalidFiles: Array<{
            name: string;
            reason: string;
        }> = [];

        for (const file of allFiles) {
            const validation = validateFileLanguage(
                file.originalname,
                language,
            );

            if (!validation.valid) {
                invalidFiles.push({
                    name: file.originalname,
                    reason:
                        validation.reason ??
                        "File failed validation.",
                });
            }
        }

        if (invalidFiles.length > 0) {
            return res.status(400).json({
                error: {
                    code: "UPLOAD_VALIDATION_FAILED",
                    message: "One or more files failed validation.",
                    details: { files: invalidFiles },
                },
            });
        }

        const totalSizeValidation = validateTotalUploadSize(
            allFiles.map((file) => file.size),
        );

        if (!totalSizeValidation.valid) {
            return res.status(413).json({
                error: {
                    code: "UPLOAD_SIZE_EXCEEDED",
                    message: totalSizeValidation.reason,
                    details: {
                        maxTotalSourceBytes:
                            UPLOAD_LIMITS.maxTotalSourceBytes,
                    },
                },
            });
        }

        const structuralThresholdRaw = body.structuralThreshold;
        let structuralThreshold = DEFAULT_STRUCTURAL_THRESHOLD;

        if (structuralThresholdRaw !== undefined) {
            const parsedThreshold = Number(structuralThresholdRaw);

            if (
                Number.isNaN(parsedThreshold) ||
                parsedThreshold < 0 ||
                parsedThreshold > 1
            ) {
                return res.status(400).json({
                    error: {
                        code: "STRUCTURAL_THRESHOLD_INVALID",
                        message:
                            "structuralThreshold must be a number between 0 and 1.",
                        details: null,
                    },
                });
            }

            structuralThreshold = parsedThreshold;
        }

        const submissions: BatchSubmission[] = submissionFiles.map(
            (file) => ({
                id: randomUUID(),
                name: file.originalname,
                language,
                source: file.buffer,
            }),
        );

        const reference: BatchSubmission = {
            id: randomUUID(),
            name: referenceFile.originalname,
            language,
            source: referenceFile.buffer,
        };

        try {
            const result = analyzeBatch(
                submissions,
                reference,
                structuralThreshold,
            );

            /*
             * BatchAnalysisResult.submissions carries the raw source
             * Buffer for internal use; it must never be serialized back
             * to the client as raw bytes.
             */
            return res.status(200).json({
                submissions: result.submissions.map(
                    (submission) => ({
                        id: submission.id,
                        name: submission.name,
                        language: submission.language,
                    }),
                ),
                matrix: result.matrix,
                suspiciousPairs: result.suspiciousPairs,
                referenceComparisons: result.referenceComparisons,
            });
        } catch (error) {
            return res.status(500).json({
                error: {
                    code: "BATCH_ANALYSIS_FAILED",
                    message:
                        error instanceof Error
                            ? error.message
                            : "Batch analysis failed.",
                    details: null,
                },
            });
        }
    },
);

export default router;
