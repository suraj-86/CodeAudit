import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import type { ChildProcessWithoutNullStreams } from "node:child_process";
import { PassThrough } from "node:stream";
import test from "node:test";

import {
    DockerExecutionWorker,
    type DockerRuntime,
} from "./docker-worker.js";
import type { ExecutionConfig } from "./execution-config.js";
import type { ExecutionRequest } from "./execution-request.js";
import type { ProcessRunner } from "./process-runner.js";

function createFakeChild() {
    const stdout = new PassThrough();
    const stderr = new PassThrough();
    const stdin = new PassThrough();

    const child = Object.assign(new EventEmitter(), {
        stdout,
        stderr,
        stdin,
        kill: () => true,
    }) as unknown as ChildProcessWithoutNullStreams;

    return {
        child,
        stdout,
        stderr,
        stdin,
    };
}

function createConfig(
    overrides: Partial<ExecutionConfig> = {},
): ExecutionConfig {
    return {
        timeoutMs: 1000,
        maxOutputBytes: 1024,
        networkDisabled: true,
        ...overrides,
    };
}

function createRuntime(): DockerRuntime {
    return {
        image: "codeaudit/python",
        command: ["python", "/runner.py"],
    };
}

function createRequest(
    source: string,
): ExecutionRequest {
    return {
        language: "python",
        source,
        testCases: [
            {
                id: "case-1",
                input: "",
                expectedOutput: "5",
            },
        ],
    };
}

test(
    "DockerExecutionWorker runs source inside the configured Docker runtime",
    async () => {
        const { child: fake, stdout, stderr } = createFakeChild();

        let receivedCommand = "";
        let receivedArgs: string[] = [];

        const processRunner: ProcessRunner = {
            run(
                command: string,
                args: string[],
                _options,
            ) {
                receivedCommand = command;
                receivedArgs = args;

                queueMicrotask(() => {
                    stdout.write("5\n");
                    fake.emit("close", 0);
                });

                return fake;
            },
        };

        const worker = new DockerExecutionWorker(
            createConfig(),
            createRuntime(),
            processRunner,
        );

        const result = await worker.run(
            createRequest("print(5)"),
        );

        assert.equal(receivedCommand, "docker");

        assert.deepEqual(receivedArgs, [
            "run",
            "--rm",
            "-i",
            "--network",
            "none",
            "--read-only",
            "--tmpfs",
            "/tmp:rw,nosuid,size=64m",
            "codeaudit/python",
            "python",
            "/runner.py",
            "print(5)",
        ]);

        assert.equal(result.status, "Passed");
        assert.equal(result.passedTests, 1);
        assert.equal(result.failedTests, 0);

        assert.equal(result.testCases.length, 1);
        assert.equal(
            result.testCases[0]?.testCaseId,
            "case-1",
        );
        assert.equal(
            result.testCases[0]?.status,
            "Passed",
        );
        assert.equal(
            result.testCases[0]?.actualOutput,
            "5",
        );
    },
);

test(
    "DockerExecutionWorker reports a runtime error when Docker exits unsuccessfully",
    async () => {
        const { child: fake, stdout, stderr } = createFakeChild();

        const processRunner: ProcessRunner = {
            run(
                _command: string,
                _args: string[],
                _options,
            ) {
                queueMicrotask(() => {
                    stderr.write("program failed\n");
                    fake.emit("close", 1);
                });

                return fake;
            },
        };

        const worker = new DockerExecutionWorker(
            createConfig(),
            createRuntime(),
            processRunner,
        );

        const result = await worker.run(
            createRequest("raise Exception()"),
        );

        assert.equal(result.status, "Runtime Error");
        assert.equal(result.passedTests, 0);
        assert.equal(result.failedTests, 1);

        assert.equal(result.testCases.length, 1);
        assert.equal(
            result.testCases[0]?.testCaseId,
            "case-1",
        );
        assert.equal(
            result.testCases[0]?.status,
            "Failed",
        );
        assert.equal(
            result.testCases[0]?.error,
            "program failed",
        );
    },
);

test(
    "DockerExecutionWorker stops execution when output exceeds the configured limit",
    async () => {
        const { child: fake, stdout, stderr } = createFakeChild();

        let killed = false;

        fake.kill = (() => {
            killed = true;
            return true;
        }) as ChildProcessWithoutNullStreams["kill"];

        const processRunner: ProcessRunner = {
            run(
                _command: string,
                _args: string[],
                _options,
            ) {
                queueMicrotask(() => {
                    stdout.write("x".repeat(20));
                });

                return fake;
            },
        };

        const worker = new DockerExecutionWorker(
            createConfig({
                maxOutputBytes: 10,
            }),
            createRuntime(),
            processRunner,
        );

        const result = await worker.run(
            createRequest("print('x')"),
        );

        assert.equal(killed, true);
        assert.equal(result.status, "Runtime Error");
        assert.equal(result.passedTests, 0);
        assert.equal(result.failedTests, 0);
        assert.deepEqual(result.testCases, []);
    },
);