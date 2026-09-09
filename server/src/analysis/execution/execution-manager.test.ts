import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import type {
    ChildProcessWithoutNullStreams,
} from "node:child_process";
import { PassThrough } from "node:stream";
import test from "node:test";

import {
    createDefaultExecutionManager,
    DefaultExecutionManager,
    type ExecutionRuntime,
} from "./execution-manager.js";

import type { ExecutionConfig } from "./execution-config.js";
import type { ExecutionRequest } from "./execution-request.js";
import type { ExecutionResult } from "./execution-result.js";
import type { ExecutionWorker } from "./execution-worker.js";
import type { ProcessRunner } from "./process-runner.js";

function createRequest(
    language = "python",
): ExecutionRequest {
    return {
        source: "print(5)",
        language,
        testCases: [
            {
                id: "case-1",
                input: "",
                expectedOutput: "5",
            },
        ],
    };
}

function createPassedResult(): ExecutionResult {
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

function createRuntime(): ExecutionRuntime {
    return {
        image: "codeaudit/python",
        command: [
            "python",
            "/runner.py",
        ],
    };
}

function createFakeChild() {
    const stdout = new PassThrough();
    const stderr = new PassThrough();
    const stdin = new PassThrough();

    const child = Object.assign(
        new EventEmitter(),
        {
            stdout,
            stderr,
            stdin,
            kill: () => true,
        },
    ) as unknown as ChildProcessWithoutNullStreams;

    return {
        child,
        stdout,
        stderr,
        stdin,
    };
}

test(
    "DefaultExecutionManager delegates a request to the worker for its language",
    async () => {
        let receivedRequest:
            | ExecutionRequest
            | undefined;

        const worker: ExecutionWorker = {
            async run(request) {
                receivedRequest = request;

                return createPassedResult();
            },
        };

        const workers = new Map<
            string,
            ExecutionWorker
        >([
            ["python", worker],
        ]);

        const manager =
            new DefaultExecutionManager(
                workers,
            );

        const request =
            createRequest();

        const result =
            await manager.execute(
                request,
            );

        assert.equal(
            receivedRequest,
            request,
        );

        assert.equal(
            result.status,
            "Passed",
        );

        assert.equal(
            result.passedTests,
            1,
        );

        assert.equal(
            result.failedTests,
            0,
        );
    },
);

test(
    "DefaultExecutionManager selects the worker using the request language",
    async () => {
        const calls: string[] = [];

        const pythonWorker:
            ExecutionWorker = {
            async run() {
                calls.push("python");

                return createPassedResult();
            },
        };

        const javascriptWorker:
            ExecutionWorker = {
            async run() {
                calls.push("javascript");

                return createPassedResult();
            },
        };

        const workers = new Map<
            string,
            ExecutionWorker
        >([
            ["python", pythonWorker],
            [
                "javascript",
                javascriptWorker,
            ],
        ]);

        const manager =
            new DefaultExecutionManager(
                workers,
            );

        await manager.execute(
            createRequest(
                "javascript",
            ),
        );

        assert.deepEqual(
            calls,
            ["javascript"],
        );
    },
);

test(
    "DefaultExecutionManager reports Unsupported when no worker exists",
    async () => {
        const manager =
            new DefaultExecutionManager(
                new Map<
                    string,
                    ExecutionWorker
                >(),
            );

        const result =
            await manager.execute(
                createRequest("ruby"),
            );

        assert.equal(
            result.status,
            "Unsupported",
        );

        assert.equal(
            result.passedTests,
            0,
        );

        assert.equal(
            result.failedTests,
            1,
        );

        assert.equal(
            result.testCases.length,
            1,
        );

        assert.equal(
            result.testCases[0]?.status,
            "Unsupported",
        );
    },
);

test(
    "DefaultExecutionManager reports Unsupported for every test case when a worker is unavailable",
    async () => {
        const manager =
            new DefaultExecutionManager(
                new Map<
                    string,
                    ExecutionWorker
                >(),
            );

        const request:
            ExecutionRequest = {
            source: "print(5)",
            language: "cpp",
            testCases: [
                {
                    id: "case-1",
                    input: "",
                    expectedOutput: "5",
                },
                {
                    id: "case-2",
                    input: "10",
                    expectedOutput: "15",
                },
                {
                    id: "case-3",
                    input: "20",
                    expectedOutput: "25",
                },
            ],
        };

        const result =
            await manager.execute(
                request,
            );

        assert.equal(
            result.status,
            "Unsupported",
        );

        assert.equal(
            result.passedTests,
            0,
        );

        assert.equal(
            result.failedTests,
            3,
        );

        assert.equal(
            result.testCases.length,
            3,
        );

        assert.ok(
            result.testCases.every(
                (testCase) =>
                    testCase.status ===
                    "Unsupported",
            ),
        );
    },
);

test(
    "createDefaultExecutionManager registers the Python Docker worker",
    async () => {
        const {
            child: fake,
            stdout,
        } = createFakeChild();

        let receivedCommand = "";
        let receivedArgs: string[] = [];

        const processRunner:
            ProcessRunner = {
            run(
                command,
                args,
                _options,
            ) {
                receivedCommand =
                    command;

                receivedArgs = args;

                queueMicrotask(() => {
                    stdout.write("5\n");
                    fake.emit(
                        "close",
                        0,
                    );
                });

                return fake;
            },
        };

        const manager =
            createDefaultExecutionManager(
                createConfig(),
                createRuntime(),
                processRunner,
            );

        const result =
            await manager.execute(
                createRequest("python"),
            );

        assert.equal(
            receivedCommand,
            "docker",
        );

        assert.deepEqual(
            receivedArgs,
            [
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
            ],
        );

        assert.equal(
            result.status,
            "Passed",
        );

        assert.equal(
            result.passedTests,
            1,
        );

        assert.equal(
            result.failedTests,
            0,
        );

        assert.equal(
            result.testCases[0]?.status,
            "Passed",
        );
    },
);