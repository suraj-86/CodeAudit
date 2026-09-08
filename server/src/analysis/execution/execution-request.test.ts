import assert from "node:assert/strict";
import test from "node:test";

import type { ExecutionRequest } from "./execution-request.js";

test("ExecutionRequest supports source, language, and test cases", () => {
    const request: ExecutionRequest = {
        source: "print(input())",
        language: "python",
        testCases: [
            {
                id: "case-1",
                input: "hello",
                expectedOutput: "hello",
            },
        ],
    };

    assert.equal(request.source, "print(input())");
    assert.equal(request.language, "python");
    assert.equal(request.testCases.length, 1);
    assert.equal(request.testCases[0]?.id, "case-1");
});