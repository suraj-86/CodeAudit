import { GoogleGenAI } from "@google/genai";

import type { AIAnalysisProvider } from "./ai-analysis-provider.js";
import type { AIAnalysisRequest } from "./ai-analysis-request.js";
import type {
    AIAnalysisLabel,
    AIAnalysisObservation,
    AIAnalysisResult,
} from "./ai-analysis-result.js";

const DEFAULT_MODEL = "gemini-3-flash-preview";
const DEFAULT_TIMEOUT_MS = 15_000;

const PROVIDER_NAME = "gemini";

const DISCLAIMER =
    "AI analysis is a probabilistic indicator only. It does not prove that code was written by AI and should not be treated as proof of authorship.";

const SYSTEM_INSTRUCTION = `
You are the AI-analysis component of CodeAudit.

Your task is to examine source code for observable characteristics that may be
associated with AI-assisted code generation.

Important rules:

1. Do not claim that you can prove who authored the code.
2. Do not state that AI generated a specific percentage of the code.
3. Treat the result as a probabilistic indicator only.
4. Consider multiple characteristics rather than relying on a single signal.
5. Consider code structure, naming consistency, comments, abstraction choices,
   repetition, boilerplate patterns, unusual consistency, and other observable
   characteristics.
6. Do not treat clean formatting, comments, common idioms, or use of standard
   libraries as proof of AI generation.
7. Explain observations briefly and concretely.
8. Return only the requested JSON structure.
`.trim();

const RESPONSE_SCHEMA = {
    type: "object",
    properties: {
        indicator: {
            type: "number",
            minimum: 0,
            maximum: 1,
            description:
                "A probabilistic AI-assistance indicator from 0 to 1. This is not a probability of authorship and is not proof.",
        },
        confidence: {
            type: "number",
            minimum: 0,
            maximum: 1,
            description:
                "Confidence in the quality of the analysis from 0 to 1.",
        },
        observations: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    category: {
                        type: "string",
                        description:
                            "Short category describing the observation.",
                    },
                    description: {
                        type: "string",
                        description:
                            "Brief concrete explanation of the observed characteristic.",
                    },
                },
                required: ["category", "description"],
            },
        },
    },
    required: ["indicator", "confidence", "observations"],
} as const;

interface GeminiGenerateContentRequest {
    model: string;
    contents: string;
    config: {
        systemInstruction: string;
        responseMimeType: "application/json";
        responseSchema: typeof RESPONSE_SCHEMA;
        temperature: number;
        maxOutputTokens: number;
        abortSignal?: AbortSignal;
    };
}

interface GeminiGenerateContentResponse {
    text?: string;
}

export interface GeminiClient {
    models: {
        generateContent(
            request: GeminiGenerateContentRequest,
        ): Promise<GeminiGenerateContentResponse>;
    };
}

interface GeminiProviderOptions {
    apiKey?: string;
    model?: string;
    timeoutMs?: number;
    client?: GeminiClient;
}

interface GeminiAnalysisPayload {
    indicator: number;
    confidence: number;
    observations: AIAnalysisObservation[];
}

export class GeminiAnalysisProvider implements AIAnalysisProvider {
    private readonly client?: GeminiClient;
    private readonly model: string;
    private readonly timeoutMs: number;

    constructor(options: GeminiProviderOptions = {}) {
        this.model =
            options.model ??
            process.env.GEMINI_MODEL ??
            DEFAULT_MODEL;

        const configuredTimeout =
            options.timeoutMs ??
            Number(
                process.env.GEMINI_TIMEOUT_MS ??
                    DEFAULT_TIMEOUT_MS,
            );

        if (
            !Number.isFinite(configuredTimeout) ||
            configuredTimeout <= 0
        ) {
            throw new Error(
                "Gemini timeout must be a positive number.",
            );
        }

        this.timeoutMs = configuredTimeout;

        if (options.client) {
            this.client = options.client;
            return;
        }

        const apiKey =
            options.apiKey ??
            process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return;
        }

        this.client = new GoogleGenAI({
            apiKey,
        }) as unknown as GeminiClient;
    }

    async analyze(
        request: AIAnalysisRequest,
    ): Promise<AIAnalysisResult> {
        if (!request.source.trim()) {
            return this.unavailable("Source code is empty.");
        }

        if (!request.language.trim()) {
            return this.unavailable(
                "Programming language is missing.",
            );
        }

        if (!this.client) {
            return this.unavailable(
                "Gemini API is not configured. Set GEMINI_API_KEY to enable AI analysis.",
            );
        }

        const controller = new AbortController();

        let timeoutHandle:
            ReturnType<typeof setTimeout> | undefined;

        try {
            const responsePromise =
                this.client.models.generateContent({
                    model: this.model,
                    contents: this.buildPrompt(request),
                    config: {
                        systemInstruction: SYSTEM_INSTRUCTION,
                        responseMimeType: "application/json",
                        responseSchema: RESPONSE_SCHEMA,
                        temperature: 0.2,
                        maxOutputTokens: 1200,
                        abortSignal: controller.signal,
                    },
                });

            const timeoutPromise =
                new Promise<never>((_, reject) => {
                    timeoutHandle = setTimeout(() => {
                        controller.abort();

                        reject(
                            new Error(
                                `Gemini analysis timed out after ${this.timeoutMs} ms.`,
                            ),
                        );
                    }, this.timeoutMs);
                });

            const response = await Promise.race([
                responsePromise,
                timeoutPromise,
            ]);

            const text = response.text?.trim();

            if (!text) {
                return this.unavailable(
                    "Gemini returned an empty response.",
                );
            }

            const payload = this.parsePayload(text);

            return {
                available: true,
                provider: PROVIDER_NAME,
                indicator: payload.indicator,
                label: this.toLabel(payload.indicator),
                confidence: payload.confidence,
                observations: payload.observations,
                disclaimer: DISCLAIMER,
            };
        } catch (error) {
            return this.unavailable(
                this.describeError(error),
            );
        } finally {
            if (timeoutHandle !== undefined) {
                clearTimeout(timeoutHandle);
            }
        }
    }

    private buildPrompt(
        request: AIAnalysisRequest,
    ): string {
        return `
Analyze the following source code.

Programming language:
${request.language}

Source code:
--- BEGIN SOURCE CODE ---
${request.source}
--- END SOURCE CODE ---

Return:

- indicator: a value from 0 to 1 representing the strength of observable characteristics associated with AI-assisted generation.
- confidence: a value from 0 to 1 representing confidence in the quality of the analysis.
- observations: concise concrete observations supporting the indicator.

Do not claim authorship or certainty.
Do not describe the indicator as a proven probability of AI authorship.
`.trim();
    }

    private parsePayload(
        text: string,
    ): GeminiAnalysisPayload {
        let parsed: unknown;

        try {
            parsed = JSON.parse(text);
        } catch {
            throw new Error(
                "Gemini returned invalid JSON.",
            );
        }

        if (
            typeof parsed !== "object" ||
            parsed === null
        ) {
            throw new Error(
                "Gemini returned an invalid analysis object.",
            );
        }

        const record = parsed as Record<string, unknown>;

        const indicator = record.indicator;
        const confidence = record.confidence;
        const observations = record.observations;

        if (
            typeof indicator !== "number" ||
            !Number.isFinite(indicator) ||
            indicator < 0 ||
            indicator > 1
        ) {
            throw new Error(
                "Gemini returned an invalid indicator.",
            );
        }

        if (
            typeof confidence !== "number" ||
            !Number.isFinite(confidence) ||
            confidence < 0 ||
            confidence > 1
        ) {
            throw new Error(
                "Gemini returned an invalid confidence value.",
            );
        }

        if (!Array.isArray(observations)) {
            throw new Error(
                "Gemini returned invalid observations.",
            );
        }

        const normalizedObservations: AIAnalysisObservation[] =
            observations.map((observation) => {
                if (
                    typeof observation !== "object" ||
                    observation === null
                ) {
                    throw new Error(
                        "Gemini returned an invalid observation.",
                    );
                }

                const item =
                    observation as Record<string, unknown>;

                if (
                    typeof item.category !== "string" ||
                    typeof item.description !== "string"
                ) {
                    throw new Error(
                        "Gemini returned an incomplete observation.",
                    );
                }

                return {
                    category: item.category,
                    description: item.description,
                };
            });

        return {
            indicator,
            confidence,
            observations: normalizedObservations,
        };
    }

    private toLabel(
        indicator: number,
    ): AIAnalysisLabel {
        if (indicator < 0.34) {
            return "low";
        }

        if (indicator < 0.67) {
            return "medium";
        }

        return "high";
    }

    private unavailable(
        error: string,
    ): AIAnalysisResult {
        return {
            available: false,
            provider: PROVIDER_NAME,
            label: "unavailable",
            observations: [],
            disclaimer: DISCLAIMER,
            error,
        };
    }

    private describeError(
        error: unknown,
    ): string {
        if (error instanceof Error) {
            return error.message;
        }

        return "Gemini analysis failed.";
    }
}