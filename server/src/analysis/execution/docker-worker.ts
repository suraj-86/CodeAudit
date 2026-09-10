import type { ProcessRunner } from "./process-runner.js";

import type { ExecutionConfig } from "./execution-config.js";
import type { ExecutionRequest } from "./execution-request.js";
import type {
    ExecutionResult,
    TestCaseResult,
} from "./execution-result.js";
import type { ExecutionWorker } from "./execution-worker.js";

export interface DockerRuntime {
    image: string;
    command: string[];
}

export class DockerExecutionWorker implements ExecutionWorker {
    constructor(
        private readonly config: ExecutionConfig,
        private readonly runtime: DockerRuntime,
        private readonly processRunner: ProcessRunner,
    ) {}

    async run(
        request: ExecutionRequest,
    ): Promise<ExecutionResult> {
        const testCaseResults: TestCaseResult[] = [];

        for (const testCase of request.testCases) {
            const result = await this.runTestCase(
                request.source,
                testCase.input,
                testCase.expectedOutput,
                testCase.id,
            );

            testCaseResults.push(result);

            /*
             * These states indicate that the current source cannot
             * continue to the remaining test cases.
             */
            if (
                result.status === "Runtime Error" ||
                result.status === "Compilation Error" ||
                result.status === "Timeout" ||
                result.status === "Execution Unavailable"
            ) {
                break;
            }
        }

        const passedTests =
            testCaseResults.filter(
                (result) =>
                    result.status === "Passed",
            ).length;

        const failedTests =
            testCaseResults.filter(
                (result) =>
                    result.status !== "Passed",
            ).length;

        let status: ExecutionResult["status"] =
            "Passed";

        if (
            testCaseResults.some(
                (result) =>
                    result.status === "Execution Unavailable",
            )
        ) {
            status = "Execution Unavailable";
        } else if (
            testCaseResults.some(
                (result) =>
                    result.status === "Timeout",
            )
        ) {
            status = "Timeout";
        } else if (
            testCaseResults.some(
                (result) =>
                    result.status === "Compilation Error",
            )
        ) {
            status = "Compilation Error";
        } else if (
            testCaseResults.some(
                (result) =>
                    result.status === "Runtime Error",
            )
        ) {
            status = "Runtime Error";
        } else if (failedTests > 0) {
            status = "Failed";
        }

        const executionTimeMs =
            testCaseResults.reduce(
                (total, result) =>
                    total +
                    (result.executionTimeMs ?? 0),
                0,
            );

        return {
            status,
            passedTests,
            failedTests,
            testCases: testCaseResults,
            executionTimeMs,
        };
    }

    private runTestCase(
        source: string,
        input: string,
        expectedOutput: string,
        testCaseId: string,
    ): Promise<TestCaseResult> {
        return new Promise((resolve) => {
            const startedAt =
                performance.now();

            const getExecutionTimeMs =
                (): number =>
                    Math.max(
                        0,
                        Math.round(
                            performance.now() -
                                startedAt,
                        ),
                    );

            const dockerArgs = [
                "run",
                "--rm",
                "-i",
            ];

            if (this.config.networkDisabled) {
                dockerArgs.push(
                    "--network",
                    "none",
                );
            }

            dockerArgs.push(
                "--read-only",
                "--tmpfs",
                "/tmp:rw,nosuid,size=64m",
                this.runtime.image,
                ...this.runtime.command,
                source,
            );

            const child =
                this.processRunner.run(
                    "docker",
                    dockerArgs,
                    {
                        stdio: [
                            "pipe",
                            "pipe",
                            "pipe",
                        ],
                        windowsHide: true,
                    },
                );

            let stdout = "";
            let stderr = "";
            let settled = false;

            const finish = (
                result: TestCaseResult,
            ): void => {
                if (settled) {
                    return;
                }

                settled = true;
                clearTimeout(timeout);
                resolve(result);
            };

            const timeout = setTimeout(() => {
                if (settled) {
                    return;
                }

                settled = true;
                child.kill("SIGKILL");

                resolve({
                    testCaseId,
                    status: "Timeout",
                    actualOutput:
                        stdout.trim(),
                    error:
                        "Execution timed out.",
                    executionTimeMs:
                        getExecutionTimeMs(),
                });
            }, this.config.timeoutMs);

            child.stdout.on(
                "data",
                (chunk: Buffer) => {
                    if (settled) {
                        return;
                    }

                    stdout +=
                        chunk.toString(
                            "utf8",
                        );

                    if (
                        Buffer.byteLength(
                            stdout,
                            "utf8",
                        ) >
                        this.config
                            .maxOutputBytes
                    ) {
                        settled = true;
                        clearTimeout(
                            timeout,
                        );

                        child.kill(
                            "SIGKILL",
                        );

                        resolve({
                            testCaseId,
                            status:
                                "Runtime Error",
                            actualOutput:
                                stdout.trim(),
                            error:
                                "Output exceeded the configured limit.",
                            executionTimeMs:
                                getExecutionTimeMs(),
                        });
                    }
                },
            );

            child.stderr.on(
                "data",
                (chunk: Buffer) => {
                    if (settled) {
                        return;
                    }

                    stderr +=
                        chunk.toString(
                            "utf8",
                        );
                },
            );

            /*
             * An error here means the Docker process itself
             * could not be started or became unavailable.
             *
             * This is different from the submitted program
             * failing inside the container.
             */
            child.on(
                "error",
                (error) => {
                    if (settled) {
                        return;
                    }

                    settled = true;
                    clearTimeout(timeout);

                    resolve({
                        testCaseId,
                        status:
                            "Execution Unavailable",
                        actualOutput:
                            stdout.trim(),
                        error:
                            error.message,
                        executionTimeMs:
                            getExecutionTimeMs(),
                    });
                },
            );

            child.on(
                "close",
                (code) => {
                    if (settled) {
                        return;
                    }

                    const actualOutput =
                        stdout.trim();

                    const error =
                        stderr.trim();

                    if (code !== 0) {
                        const compilationError =
                            error.includes(
                                "SyntaxError",
                            ) ||
                            error.includes(
                                "IndentationError",
                            ) ||
                            error.includes(
                                "TabError",
                            );

                        finish({
                            testCaseId,
                            status:
                                compilationError
                                    ? "Compilation Error"
                                    : "Runtime Error",
                            actualOutput,
                            error,
                            executionTimeMs:
                                getExecutionTimeMs(),
                        });

                        return;
                    }

                    const passed =
                        actualOutput ===
                        expectedOutput.trim();

                    finish({
                        testCaseId,
                        status: passed
                            ? "Passed"
                            : "Failed",
                        actualOutput,
                        error,
                        executionTimeMs:
                            getExecutionTimeMs(),
                    });
                },
            );

            child.stdin.end(input);
        });
    }
}