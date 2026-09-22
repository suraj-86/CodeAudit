import assert from "node:assert/strict";
import test from "node:test";

import {
    GeminiAnalysisProvider,
    type GeminiClient,
} from "./gemini-provider.js";

function createMockClient(
    responseText: string,
): GeminiClient {
    return {
        models: {
            async generateContent() {
                return {
                    text: responseText,
                };
            },
        },
    };
}

test("GeminiAnalysisProvider maps a valid response", async () => {
    const provider =
        new GeminiAnalysisProvider({
            client: createMockClient(
                JSON.stringify({
                    indicator: 0.72,
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
                }),
            ),
        });

    const result = await provider.analyze({
        language: "Python",
        source: `
def add(a, b):
    return a + b
`,
    });

    assert.equal(result.available, true);
    assert.equal(result.provider, "gemini");
    assert.equal(result.indicator, 0.72);
    assert.equal(result.label, "high");
    assert.equal(result.confidence, 0.81);
    assert.equal(result.observations.length, 2);
    assert.equal(result.error, undefined);
});

test("GeminiAnalysisProvider returns unavailable when no API client is configured", async () => {
const provider =
    new GeminiAnalysisProvider({});

    const result = await provider.analyze({
        language: "Python",
        source: "print('hello')",
    });

    assert.equal(result.available, false);
    assert.equal(result.provider, "gemini");
    assert.equal(result.label, "unavailable");
    assert.equal(result.observations.length, 0);

    assert.match(
        result.error ?? "",
        /GEMINI_API_KEY/,
    );
});

test("GeminiAnalysisProvider handles invalid JSON", async () => {
    const provider =
        new GeminiAnalysisProvider({
            client: createMockClient(
                "not valid json",
            ),
        });

    const result = await provider.analyze({
        language: "Python",
        source: "print('hello')",
    });

    assert.equal(result.available, false);
    assert.equal(result.label, "unavailable");
    assert.equal(result.indicator, undefined);

    assert.match(
        result.error ?? "",
        /invalid JSON/i,
    );
});

test("GeminiAnalysisProvider rejects an invalid indicator", async () => {
    const provider =
        new GeminiAnalysisProvider({
            client: createMockClient(
                JSON.stringify({
                    indicator: 2,
                    confidence: 0.8,
                    observations: [],
                }),
            ),
        });

    const result = await provider.analyze({
        language: "Python",
        source: "print('hello')",
    });

    assert.equal(result.available, false);
    assert.equal(result.label, "unavailable");

    assert.match(
        result.error ?? "",
        /invalid indicator/i,
    );
});

test("GeminiAnalysisProvider handles API failures", async () => {
    const client: GeminiClient = {
        models: {
            async generateContent() {
                throw new Error(
                    "Gemini API request failed",
                );
            },
        },
    };

    const provider =
        new GeminiAnalysisProvider({
            client,
        });

    const result = await provider.analyze({
        language: "Python",
        source: "print('hello')",
    });

    assert.equal(result.available, false);
    assert.equal(result.label, "unavailable");
    assert.equal(
        result.error,
        "Gemini API request failed",
    );
});

test("GeminiAnalysisProvider times out a slow request", async () => {
    const client: GeminiClient = {
        models: {
            async generateContent(request) {
                return new Promise((resolve, reject) => {
                    const timer = setTimeout(() => {
                        resolve({
                            text: JSON.stringify({
                                indicator: 0.5,
                                confidence: 0.5,
                                observations: [],
                            }),
                        });
                    }, 1_000);

                    request.config.abortSignal?.addEventListener(
                        "abort",
                        () => {
                            clearTimeout(timer);

                            reject(
                                new Error(
                                    "Request aborted",
                                ),
                            );
                        },
                        { once: true },
                    );
                });
            },
        },
    };

    const provider =
        new GeminiAnalysisProvider({
            client,
            timeoutMs: 20,
        });

    const result = await provider.analyze({
        language: "Python",
        source: "print('hello')",
    });

    assert.equal(result.available, false);
    assert.equal(result.label, "unavailable");

    assert.match(
        result.error ?? "",
        /timed out after 20 ms/i,
    );
});