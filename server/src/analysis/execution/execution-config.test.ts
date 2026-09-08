import assert from "node:assert/strict";
import test from "node:test";

import type { ExecutionConfig } from "./execution-config.js";

test("ExecutionConfig defines execution safety controls", () => {
    const config: ExecutionConfig = {
        timeoutMs: 1000,
        maxOutputBytes: 1024,
        networkDisabled: true,
    };

    assert.equal(config.timeoutMs, 1000);
    assert.equal(config.maxOutputBytes, 1024);
    assert.equal(config.networkDisabled, true);
});