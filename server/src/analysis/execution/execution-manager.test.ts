import assert from "node:assert/strict";
import test from "node:test";

import type { ExecutionManager } from "./execution-manager.js";
import type { ExecutionRequest } from "./execution-request.js";
import type { ExecutionResult } from "./execution-result.js";

test("ExecutionManager returns an ExecutionResult for a request", async () => {
    const manager: ExecutionManager = {
        async execute(
            request: ExecutionRequest,
        ): Promise<ExecutionResult> {
            assert.equal(request.language, "python");
            assert.equal(request.testCases.length, 1);

            return {
                status: "Passed",
                passedTests: 1,
                failedTests: 0,
                testCases: [
                    {
                        testCaseId: "case-1",
                        status: "Passed",
                        actualOutput: "5",
                    },
                ],
            };
        },
    };

    const request: ExecutionRequest = {
        source: "print(5)",
        language: "python",
        testCases: [
            {
                id: "case-1",
                input: "",
                expectedOutput: "5",
            },
        ],
    };

    const result = await manager.execute(request);

    assert.equal(result.status, "Passed");
    assert.equal(result.passedTests, 1);
    assert.equal(result.failedTests, 0);
    assert.equal(result.testCases[0]?.testCaseId, "case-1");
});
