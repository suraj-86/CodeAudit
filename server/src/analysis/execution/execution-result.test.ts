import assert from "node:assert/strict";
import test from "node:test";

import type {
    ExecutionResult,
    ExecutionStatus,
    TestCaseResult,
} from "./execution-result.js";

test("ExecutionResult supports a passed execution", () => {
    const status: ExecutionStatus = "Passed";

    const testCaseResult: TestCaseResult = {
        testCaseId: "case-1",
        status,
        actualOutput: "5",
        executionTimeMs: 12,
    };

    const result: ExecutionResult = {
        status,
        passedTests: 1,
        failedTests: 0,
        testCases: [testCaseResult],
        executionTimeMs: 12,
    };

    assert.equal(result.status, "Passed");
    assert.equal(result.passedTests, 1);
    assert.equal(result.failedTests, 0);
    assert.equal(result.testCases.length, 1);
    assert.equal(result.testCases[0]?.actualOutput, "5");
});

test("ExecutionResult supports a compilation error", () => {
    const result: ExecutionResult = {
        status: "Compilation Error",
        passedTests: 0,
        failedTests: 0,
        testCases: [],
    };

    assert.equal(result.status, "Compilation Error");
    assert.equal(result.passedTests, 0);
    assert.equal(result.failedTests, 0);
});

test("ExecutionResult supports a timeout", () => {
    const result: ExecutionResult = {
        status: "Timeout",
        passedTests: 0,
        failedTests: 1,
        testCases: [
            {
                testCaseId: "case-1",
                status: "Timeout",
                error: "Execution timed out.",
            },
        ],
    };

    assert.equal(result.status, "Timeout");
    assert.equal(result.testCases[0]?.status, "Timeout");
    assert.equal(result.testCases[0]?.error, "Execution timed out.");
});