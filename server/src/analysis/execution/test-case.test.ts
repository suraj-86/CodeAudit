import assert from "node:assert/strict";
import test from "node:test";

import type { TestCase } from "./test-case.js";

test("TestCase supports input and expected output", () => {
    const testCase: TestCase = {
        id: "case-1",
        input: "2 3",
        expectedOutput: "5",
    };

    assert.equal(testCase.id, "case-1");
    assert.equal(testCase.input, "2 3");
    assert.equal(testCase.expectedOutput, "5");
});