import { calculateSha256 } from "../analysis/exact-match/hash.js";
import { compareFiles } from "../analysis/exact-match/compare.js";
import { parseCpp } from "../analysis/structural/cpp-parser.js";
import { structuralSequence } from "../analysis/structural/traversal.js";
import { compareStructuralSequences } from "../analysis/structural/compare.js";
import type { StructuralSimilarityResult } from "../analysis/structural/similarity-result.js";

import type { ExecutionManager } from "../analysis/execution/execution-manager.js";
import type { ExecutionResult } from "../analysis/execution/execution-result.js";
import type { TestCase } from "../analysis/execution/test-case.js";

import type { AIAnalysisService } from "../analysis/ai/ai-analysis-service.js";
import type { AIAnalysisResult } from "../analysis/ai/ai-analysis-result.js";

export interface WorkflowSourceFile {
    filename: string;
    language: string;
    source: Buffer;
}

export interface AnalysisWorkflowRequest {
    projectName?: string | undefined;
    source: WorkflowSourceFile;
    reference?: WorkflowSourceFile | undefined;
    testCases?: TestCase[] | undefined;
    runAI?: boolean | undefined;
    structuralThreshold?: number | undefined;
}

export interface AnalysisWorkflowEvidence {
    category: string;
    description: string;
}
export interface AnalysisWorkflowResult {
    projectName?: string | undefined;
    sourceFiles: Array<{
        filename: string;
        language?: string;
        sha256?: string;
    }>;
    correctness?:
        | {
              source: ExecutionResult;
              comparison?: ExecutionResult | undefined;
          }
        | undefined;
    similarity?: StructuralSimilarityResult | undefined;
    aiAnalysis?: AIAnalysisResult | undefined;
    evidence: AnalysisWorkflowEvidence[];
    disclaimer: string;
    generatedAt: string;
    warnings: string[];
}

const DEFAULT_STRUCTURAL_THRESHOLD = 0.75;

const REPORT_DISCLAIMER =
    "This report presents independent analytical signals: exact matching, " +
    "structural similarity, functional correctness, and AI-assisted " +
    "analysis where available. None of these signals individually or in " +
    "combination constitutes proof of academic misconduct or AI " +
    "authorship. Results should be interpreted by a qualified human " +
    "reviewer alongside other evidence.";

function isCpp(file: WorkflowSourceFile): boolean {
    return file.language.toLowerCase() === "cpp";
}

function isPython(file: WorkflowSourceFile): boolean {
    return file.language.toLowerCase() === "python";
}

export class AnalysisWorkflowOrchestrator {
    constructor(
        private readonly executionManager: ExecutionManager,
        private readonly aiAnalysisService: AIAnalysisService,
    ) {}

    async run(
        request: AnalysisWorkflowRequest,
    ): Promise<AnalysisWorkflowResult> {
        const structuralThreshold =
            request.structuralThreshold ??
            DEFAULT_STRUCTURAL_THRESHOLD;

        const evidence: AnalysisWorkflowEvidence[] = [];
        const warnings: string[] = [];

        const sourceHash = calculateSha256(
            request.source.source,
        );

        const sourceFiles: AnalysisWorkflowResult["sourceFiles"] =
            [
                {
                    filename: request.source.filename,
                    language: request.source.language,
                    sha256: sourceHash,
                },
            ];

        evidence.push({
            category: "Hash",
            description: `${request.source.filename}: SHA-256 ${sourceHash}.`,
        });

        if (request.reference) {
            const referenceHash = calculateSha256(
                request.reference.source,
            );

            sourceFiles.push({
                filename: request.reference.filename,
                language: request.reference.language,
                sha256: referenceHash,
            });

            evidence.push({
                category: "Hash",
                description: `${request.reference.filename}: SHA-256 ${referenceHash}.`,
            });

            const exactResult = compareFiles(
                request.source.source,
                request.reference.source,
            );

            evidence.push({
                category: "Exact Match",
                description: exactResult.exactMatch
                    ? "The submission is byte-identical to the reference."
                    : "The submission is not byte-identical to the reference.",
            });
        }

        const similarity = this.runStructuralAnalysis(
            request,
            structuralThreshold,
            evidence,
            warnings,
        );

        const correctness = await this.runExecutionAnalysis(
            request,
            evidence,
            warnings,
        );

        const aiAnalysis = await this.runAIAnalysis(
            request,
            evidence,
            warnings,
        );

        return {
            projectName: request.projectName,
            sourceFiles,
            correctness,
            similarity,
            aiAnalysis,
            evidence,
            disclaimer: REPORT_DISCLAIMER,
            generatedAt: new Date().toISOString(),
            warnings,
        };
    }

    private runStructuralAnalysis(
        request: AnalysisWorkflowRequest,
        structuralThreshold: number,
        evidence: AnalysisWorkflowEvidence[],
        warnings: string[],
    ): StructuralSimilarityResult | undefined {
        if (!request.reference) {
            warnings.push(
                "Structural similarity skipped: no reference submission was provided.",
            );
            return undefined;
        }

        if (!isCpp(request.source) || !isCpp(request.reference)) {
            warnings.push(
                "Structural similarity skipped: currently supported for C++ submissions only.",
            );
            return undefined;
        }

        const sourceTree = parseCpp(
            request.source.source.toString("utf8"),
        );
        const referenceTree = parseCpp(
            request.reference.source.toString("utf8"),
        );

        const result = compareStructuralSequences(
            structuralSequence(sourceTree.rootNode),
            structuralSequence(referenceTree.rootNode),
            structuralThreshold,
        );

        evidence.push({
            category: "Structural Similarity",
            description:
                `Structural similarity to reference: ` +
                `${(result.similarity * 100).toFixed(2)}% ` +
                `(threshold ${(result.threshold * 100).toFixed(0)}%, ` +
                `${result.suspicious ? "flagged" : "not flagged"} as suspicious).`,
        });

        return result;
    }

    private async runExecutionAnalysis(
        request: AnalysisWorkflowRequest,
        evidence: AnalysisWorkflowEvidence[],
        warnings: string[],
    ): Promise<
        | { source: ExecutionResult; comparison?: ExecutionResult | undefined }
        | undefined
    > {
        if (!request.testCases || request.testCases.length === 0) {
            warnings.push(
                "Correctness testing skipped: no test cases were provided.",
            );
            return undefined;
        }

        if (!isPython(request.source)) {
            warnings.push(
                `Correctness testing skipped: execution currently supports Python only ` +
                    `(submission language "${request.source.language}").`,
            );
            return undefined;
        }

        const sourceResult = await this.executionManager.execute(
            {
                source: request.source.source.toString("utf8"),
                language: request.source.language.toLowerCase(),
                testCases: request.testCases,
            },
        );

        evidence.push({
            category: "Correctness",
            description:
                `Submission execution: ${sourceResult.status} ` +
                `(${sourceResult.passedTests} passed, ` +
                `${sourceResult.failedTests} failed).`,
        });

        let comparisonResult: ExecutionResult | undefined;

        if (request.reference && isPython(request.reference)) {
            comparisonResult = await this.executionManager.execute(
                {
                    source: request.reference.source.toString(
                        "utf8",
                    ),
                    language:
                        request.reference.language.toLowerCase(),
                    testCases: request.testCases,
                },
            );

            evidence.push({
                category: "Correctness",
                description:
                    `Reference execution: ${comparisonResult.status} ` +
                    `(${comparisonResult.passedTests} passed, ` +
                    `${comparisonResult.failedTests} failed).`,
            });
        } else if (request.reference) {
            warnings.push(
                "Reference execution skipped: execution currently supports Python only " +
                    `(reference language "${request.reference.language}").`,
            );
        }

        return {
            source: sourceResult,
            comparison: comparisonResult,
        };
    }

    private async runAIAnalysis(
        request: AnalysisWorkflowRequest,
        evidence: AnalysisWorkflowEvidence[],
        warnings: string[],
    ): Promise<AIAnalysisResult | undefined> {
        if (request.runAI === false) {
            warnings.push(
                "AI-assisted analysis skipped: disabled for this request.",
            );
            return undefined;
        }

        try {
            const result = await this.aiAnalysisService.analyze({
                source: request.source.source.toString("utf8"),
                language: request.source.language,
            });

            if (result.available && result.indicator !== undefined) {
                evidence.push({
                    category: "AI-Assisted Analysis",
                    description:
                        `AI-assisted indicator: ${(result.indicator * 100).toFixed(2)}% ` +
                        `(${result.label}).`,
                });
            } else {
                warnings.push(
                    "AI-assisted analysis unavailable" +
                        (result.error ? `: ${result.error}` : "."),
                );
            }

            return result;
        } catch (error) {

            const message =
                error instanceof Error
                    ? error.message
                    : "Unknown error.";

            warnings.push(
                `AI-assisted analysis failed unexpectedly: ${message}`,
            );

            return {
                available: false,
                provider: "unknown",
                label: "unavailable",
                observations: [],
                disclaimer:
                    "AI analysis is a probabilistic indicator only. It does not prove that code was written by AI and should not be treated as proof of authorship.",
                error: message,
            };
        }
    }
}
