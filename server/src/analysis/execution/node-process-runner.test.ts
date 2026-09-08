import assert from "node:assert/strict";
import test from "node:test";

import { NodeProcessRunner } from "./node-process-runner.js";

test("NodeProcessRunner starts a process", async () => {
    const runner = new NodeProcessRunner();

const child = runner.run(
    process.execPath,
    ["-e", "process.stdout.write('ok')"],
    {
        stdio: ["pipe", "pipe", "pipe"],
    },
);

    let stdout = "";

    child.stdout?.on("data", (chunk: Buffer) => {
        stdout += chunk.toString();
    });

    await new Promise<void>((resolve, reject) => {
        child.once("error", reject);
        child.once("close", () => resolve());
    });

    assert.equal(stdout, "ok");
});