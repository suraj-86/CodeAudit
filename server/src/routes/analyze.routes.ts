import { Router, type Response } from "express";

import { upload } from "../config/upload.js";
import { EXECUTION_CONFIG, PYTHON_RUNTIME } from "../config/execution.js";
import { validateFileLanguage } from "../validation/file-validation.js";
import { uploadRateLimiter } from "../middleware/rate-limit.js";

import { createDefaultExecutionManager } from "../analysis/execution/execution-manager.js";
import type { TestCase } from "../analysis/execution/test-case.js";
import { AIAnalysisService } from "../analysis/ai/ai-analysis-service.js";
import { GeminiAnalysisProvider } from "../analysis/ai/gemini-provider.js";

import {
    AnalysisWorkflowOrchestrator,
    type WorkflowSourceFile,
} from "../workflow/analysis-workflow.js";

const router = Router();

const executionManager = createDefaultExecutionManager(
    EXECUTION_CONFIG,
    PYTHON_RUNTIME,
);

const aiAnalysisService = new AIAnalysisService(
    new GeminiAnalysisProvider(),
);

const orchestrator = new AnalysisWorkflowOrchestrator(
    executionManager,
    aiAnalysisService,
);

function badRequest(
    res: Response,
    code: string,
    message: string,
) {
    return res.status(400).json({
        error: {
            code,
            message,
            details: null,
        },
    });
}

function parseTestCases(raw: unknown): TestCase[] | undefined {
    if (raw === undefined) {
        return undefined;
    }

    if (typeof raw !== "string" || !raw.trim()) {
        return undefined;
    }

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
        throw new Error("testCases must be a JSON array.");
    }

    return parsed.map((entry, index) => {
        if (
            !entry ||
            typeof entry !== "object" ||
            typeof (entry as TestCase).input !== "string" ||
            typeof (entry as TestCase).expectedOutput !== "string"
        ) {
            throw new Error(
                `testCases[${index}] must have string "input" and "expectedOutput".`,
            );
        }

        return {
            id:
                typeof (entry as TestCase).id === "string"
                    ? (entry as TestCase).id
                    : `case-${index + 1}`,
            input: (entry as TestCase).input,
            expectedOutput: (entry as TestCase).expectedOutput,
        };
    });
}

router.post(
    "/analyze/workflow",
    uploadRateLimiter,
    upload.fields([
        { name: "source", maxCount: 1 },
        { name: "reference", maxCount: 1 },
    ]),
    async (req, res) => {
        const files = req.files as
            | { [fieldname: string]: Express.Multer.File[] }
            | undefined;

        const sourceFile = files?.source?.[0];
        const referenceFile = files?.reference?.[0];
        const body = (req.body ?? {}) as Record<string, unknown>;

        if (!sourceFile) {
            return badRequest(
                res,
                "SOURCE_REQUIRED",
                "A source-code file is required under the \"source\" field.",
            );
        }

        const language =
            typeof body.language === "string"
                ? body.language.trim().toLowerCase()
                : "";

        if (!language) {
            return badRequest(
                res,
                "LANGUAGE_REQUIRED",
                "A programming language must be specified for the source file.",
            );
        }

        const sourceValidation = validateFileLanguage(
            sourceFile.originalname,
            language,
        );

        if (!sourceValidation.valid) {
            return badRequest(
                res,
                "UPLOAD_VALIDATION_FAILED",
                sourceValidation.reason ?? "Invalid source file.",
            );
        }

        const source: WorkflowSourceFile = {
            filename: sourceFile.originalname,
            language,
            source: sourceFile.buffer,
        };

        let reference: WorkflowSourceFile | undefined;

        if (referenceFile) {
            const referenceLanguage =
                typeof body.referenceLanguage === "string" &&
                body.referenceLanguage.trim()
                    ? body.referenceLanguage.trim().toLowerCase()
                    : language;

            const referenceValidation = validateFileLanguage(
                referenceFile.originalname,
                referenceLanguage,
            );

            if (!referenceValidation.valid) {
                return badRequest(
                    res,
                    "UPLOAD_VALIDATION_FAILED",
                    referenceValidation.reason ??
                        "Invalid reference file.",
                );
            }

            reference = {
                filename: referenceFile.originalname,
                language: referenceLanguage,
                source: referenceFile.buffer,
            };
        }

        let testCases: TestCase[] | undefined;

        try {
            testCases = parseTestCases(body.testCases);
        } catch (error) {
            return badRequest(
                res,
                "TEST_CASES_INVALID",
                error instanceof Error
                    ? error.message
                    : "Invalid test cases.",
            );
        }

        const structuralThresholdRaw = body.structuralThreshold;
        let structuralThreshold: number | undefined;

        if (structuralThresholdRaw !== undefined) {
            const parsedThreshold = Number(structuralThresholdRaw);

            if (
                Number.isNaN(parsedThreshold) ||
                parsedThreshold < 0 ||
                parsedThreshold > 1
            ) {
                return badRequest(
                    res,
                    "STRUCTURAL_THRESHOLD_INVALID",
                    "structuralThreshold must be a number between 0 and 1.",
                );
            }

            structuralThreshold = parsedThreshold;
        }

        const runAI = body.runAI !== "false";

        try {
            const result = await orchestrator.run({
                projectName:
                    typeof body.projectName === "string"
                        ? body.projectName
                        : undefined,
                source,
                ...(reference !== undefined ? { reference } : {}),
                ...(testCases !== undefined ? { testCases } : {}),
                runAI,
                ...(structuralThreshold !== undefined
                    ? { structuralThreshold }
                    : {}),
            });

            return res.status(200).json(result);
        } catch (error) {
            return res.status(500).json({
                error: {
                    code: "WORKFLOW_FAILED",
                    message:
                        error instanceof Error
                            ? error.message
                            : "Analysis workflow failed.",
                    details: null,
                },
            });
        }
    },
);

export default router;
