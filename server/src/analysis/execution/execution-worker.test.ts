import assert from "node:assert/strict";
import test from "node:test";

import type { ExecutionWorker } from "./execution-worker.js";
import type { ExecutionRequest } from "./execution-request.js";
import type { ExecutionResult } from "./execution-result.js";

test("ExecutionWorker runs a request and returns an execution result", async () => {
    const worker: ExecutionWorker = {
        async run(
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

    const result = await worker.run(request);

    assert.equal(result.status, "Passed");
    assert.equal(result.passedTests, 1);
    assert.equal(result.failedTests, 0);
    assert.equal(result.testCases[0]?.actualOutput, "5");
});