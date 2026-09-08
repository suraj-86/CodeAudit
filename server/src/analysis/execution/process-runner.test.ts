import assert from "node:assert/strict";
import test from "node:test";

import type { ProcessRunner } from "./process-runner.js";

test("ProcessRunner defines a process execution boundary", () => {
    const runner: ProcessRunner = {
        run(command, args) {
            assert.equal(command, "docker");
            assert.deepEqual(args, ["version"]);

            return {} as never;
        },
    };

    const process = runner.run("docker", ["version"], {
    stdio: ["pipe", "pipe", "pipe"],
});

    assert.ok(process);
});