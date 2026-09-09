import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import type {
    ChildProcessWithoutNullStreams,
} from "node:child_process";
import { PassThrough } from "node:stream";
import test from "node:test";

import {
    DockerExecutionWorker,
    type DockerRuntime,
} from "./docker-worker.js";

import type {
    ExecutionConfig,
} from "./execution-config.js";

import type {
    ExecutionRequest,
} from "./execution-request.js";

import type {
    ProcessRunner,
} from "./process-runner.js";

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
        command: [
            "python",
            "/runner.py",
        ],
    };
}

function createRequest(
    source: string,
    testCases = [
        {
            id: "case-1",
            input: "",
            expectedOutput: "5",
        },
    ],
): ExecutionRequest {
    return {
        language: "python",
        source,
        testCases,
    };
}

test(
    "DockerExecutionWorker runs source inside the configured Docker runtime",
    async () => {
        const {
            child: fake,
            stdout,
        } = createFakeChild();

        let receivedCommand = "";
        let receivedArgs: string[] = [];

        const processRunner: ProcessRunner = {
            run(
                command: string,
                args: string[],
                _options,
            ) {
                receivedCommand =
                    command;

                receivedArgs =
                    args;

                queueMicrotask(() => {
    stdout.write("5\n");

    setImmediate(() => {
        fake.emit("close", 0);
    });
});

                return fake;
            },
        };

        const worker =
            new DockerExecutionWorker(
                createConfig(),
                createRuntime(),
                processRunner,
            );

        const result =
            await worker.run(
                createRequest(
                    "print(5)",
                ),
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
            1,
        );

        assert.equal(
            result.testCases.length,
            1,
        );

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

        assert.equal(
            typeof result.testCases[0]?.executionTimeMs,
            "number",
        );
    },
);

test(
    "DockerExecutionWorker sends the test-case input to the executed program",
    async () => {
        const {
            child: fake,
            stdout,
            stdin,
        } = createFakeChild();

        let receivedInput = "";

        stdin.on(
            "data",
            (chunk: Buffer) => {
                receivedInput +=
                    chunk.toString("utf8");
            },
        );

        const processRunner: ProcessRunner = {
            run(
                _command,
                _args,
                _options,
            ) {
                queueMicrotask(() => {
                    stdout.write("25\n");

                    fake.emit(
                        "close",
                        0,
                    );
                });

                return fake;
            },
        };

        const worker =
            new DockerExecutionWorker(
                createConfig(),
                createRuntime(),
                processRunner,
            );

        const result =
            await worker.run(
                createRequest(
                    [
                        "number = int(input())",
                        "print(number * number)",
                    ].join("\n"),
                    [
                        {
                            id: "case-1",
                            input: "5\n",
                            expectedOutput: "25",
                        },
                    ],
                ),
            );

        assert.equal(
            receivedInput,
            "5\n",
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
    "DockerExecutionWorker marks a test case Failed when actual output differs from expected output",
    async () => {
        const {
            child: fake,
            stdout,
        } = createFakeChild();

        const processRunner: ProcessRunner = {
            run(
                _command,
                _args,
                _options,
            ) {
                queueMicrotask(() => {
                    stdout.write(
                        "wrong output\n",
                    );

                    fake.emit(
                        "close",
                        0,
                    );
                });

                return fake;
            },
        };

        const worker =
            new DockerExecutionWorker(
                createConfig(),
                createRuntime(),
                processRunner,
            );

        const result =
            await worker.run(
                createRequest(
                    "print('wrong output')",
                    [
                        {
                            id: "case-1",
                            input: "",
                            expectedOutput:
                                "expected output",
                        },
                    ],
                ),
            );

        assert.equal(
            result.status,
            "Failed",
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
            "Failed",
        );

        assert.equal(
            result.testCases[0]?.actualOutput,
            "wrong output",
        );
    },
);

test(
    "DockerExecutionWorker evaluates multiple test cases independently",
    async () => {
        const children: ReturnType<
            typeof createFakeChild
        >[] = [];

        let runCount = 0;

        const processRunner: ProcessRunner = {
            run(
                _command,
                _args,
                _options,
            ) {
                const child =
                    createFakeChild();

                children.push(child);

                runCount += 1;

                queueMicrotask(() => {
                    if (runCount === 1) {
                        child.stdout.write(
                            "4\n",
                        );
                    } else {
                        child.stdout.write(
                            "25\n",
                        );
                    }

                    child.child.emit(
                        "close",
                        0,
                    );
                });

                return child.child;
            },
        };

        const worker =
            new DockerExecutionWorker(
                createConfig(),
                createRuntime(),
                processRunner,
            );

        const result =
            await worker.run(
                createRequest(
                    [
                        "number = int(input())",
                        "print(number * number)",
                    ].join("\n"),
                    [
                        {
                            id: "case-1",
                            input: "2\n",
                            expectedOutput:
                                "4",
                        },
                        {
                            id: "case-2",
                            input: "5\n",
                            expectedOutput:
                                "25",
                        },
                    ],
                ),
            );

        assert.equal(
            runCount,
            2,
        );

        assert.equal(
            result.status,
            "Passed",
        );

        assert.equal(
            result.passedTests,
            2,
        );

        assert.equal(
            result.failedTests,
            0,
        );

        assert.equal(
            result.testCases.length,
            2,
        );

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
            "4",
        );

        assert.equal(
            result.testCases[1]?.testCaseId,
            "case-2",
        );

        assert.equal(
            result.testCases[1]?.status,
            "Passed",
        );

        assert.equal(
            result.testCases[1]?.actualOutput,
            "25",
        );
    },
);

test(
    "DockerExecutionWorker reports a runtime error when Docker exits unsuccessfully",
    async () => {
        const {
            child: fake,
            stderr,
        } = createFakeChild();

        const processRunner: ProcessRunner = {
            run(
                _command,
                _args,
                _options,
            ) {
                queueMicrotask(() => {
                    stderr.write(
                        "program failed\n",
                    );

                    fake.emit(
                        "close",
                        1,
                    );
                });

                return fake;
            },
        };

        const worker =
            new DockerExecutionWorker(
                createConfig(),
                createRuntime(),
                processRunner,
            );

        const result =
            await worker.run(
                createRequest(
                    "raise Exception()",
                ),
            );

        assert.equal(
            result.status,
            "Runtime Error",
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
            result.testCases[0]?.testCaseId,
            "case-1",
        );

        assert.equal(
            result.testCases[0]?.status,
            "Runtime Error",
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
        const {
            child: fake,
            stdout,
        } = createFakeChild();

        let killed = false;

        fake.kill = (() => {
            killed = true;

            return true;
        }) as ChildProcessWithoutNullStreams["kill"];

        const processRunner: ProcessRunner = {
            run(
                _command,
                _args,
                _options,
            ) {
                queueMicrotask(() => {
                    stdout.write(
                        "x".repeat(20),
                    );
                });

                return fake;
            },
        };

        const worker =
            new DockerExecutionWorker(
                createConfig({
                    maxOutputBytes: 10,
                }),
                createRuntime(),
                processRunner,
            );

        const result =
            await worker.run(
                createRequest(
                    "print('x')",
                ),
            );

        assert.equal(
            killed,
            true,
        );

        assert.equal(
            result.status,
            "Runtime Error",
        );

        assert.equal(
            result.passedTests,
            0,
        );

        assert.equal(
            result.failedTests,
            0,
        );

        assert.deepEqual(
            result.testCases,
            [],
        );
    },
);

test(
    "DockerExecutionWorker stops execution when the timeout is reached",
    async () => {
        const {
            child: fake,
        } = createFakeChild();

        let killed = false;

        fake.kill = (() => {
            killed = true;

            return true;
        }) as ChildProcessWithoutNullStreams["kill"];

        const processRunner: ProcessRunner = {
            run(
                _command,
                _args,
                _options,
            ) {
                return fake;
            },
        };

        const worker =
            new DockerExecutionWorker(
                createConfig({
                    timeoutMs: 20,
                }),
                createRuntime(),
                processRunner,
            );

        const result =
            await worker.run(
                createRequest(
                    "while True: pass",
                ),
            );

        assert.equal(
            killed,
            true,
        );

        assert.equal(
            result.status,
            "Timeout",
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
            "Timeout",
        );
    },
);