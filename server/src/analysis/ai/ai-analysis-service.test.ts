import assert from "node:assert/strict";
import test from "node:test";

import { AIAnalysisService } from "./ai-analysis-service.js";
import type { AIAnalysisProvider } from "./ai-analysis-provider.js";
import type { AIAnalysisRequest } from "./ai-analysis-request.js";
import type { AIAnalysisResult } from "./ai-analysis-result.js";

const DISCLAIMER =
    "AI analysis is a probabilistic indicator only. It does not prove that code was written by AI and should not be treated as proof of authorship.";

test("AIAnalysisService delegates the request to the configured provider", async () => {
    const request: AIAnalysisRequest = {
        language: "Python",
        source: 'print("hello")',
    };

    const expectedResult: AIAnalysisResult = {
        available: true,
        provider: "gemini",
        indicator: 0.72,
        label: "high",
        confidence: 0.81,
        observations: [
            {
                category: "Consistency",
                description:
                    "The implementation uses unusually consistent naming and abstraction patterns.",
            },
            {
                category: "Boilerplate",
                description:
                    "Several sections follow highly standardized patterns.",
            },
        ],
        disclaimer: DISCLAIMER,
    };

    let receivedRequest: AIAnalysisRequest | undefined;

    const provider: AIAnalysisProvider = {
        async analyze(
            input: AIAnalysisRequest,
        ): Promise<AIAnalysisResult> {
            receivedRequest = input;
            return expectedResult;
        },
    };

    const service = new AIAnalysisService(provider);

    const result = await service.analyze(request);

    assert.deepEqual(receivedRequest, request);
    assert.strictEqual(result, expectedResult);
});

test("AIAnalysisService returns the provider result unchanged", async () => {
    const expectedResult: AIAnalysisResult = {
        available: false,
        provider: "gemini",
        label: "unavailable",
        observations: [],
        disclaimer: DISCLAIMER,
        error: "Gemini API is not configured.",
    };

    const provider: AIAnalysisProvider = {
        async analyze(): Promise<AIAnalysisResult> {
            return expectedResult;
        },
    };

    const service = new AIAnalysisService(provider);

    const result = await service.analyze({
        language: "JavaScript",
        source: "console.log('hello');",
    });

    assert.strictEqual(result, expectedResult);
});