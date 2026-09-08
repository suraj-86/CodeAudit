import type { ProcessRunner } from "./process-runner.js";

import type { ExecutionConfig } from "./execution-config.js";
import type { ExecutionRequest } from "./execution-request.js";
import type { ExecutionResult } from "./execution-result.js";
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

    run(request: ExecutionRequest): Promise<ExecutionResult> {
        return new Promise((resolve, reject) => {
            const dockerArgs = [
                "run",
                "--rm",
                "-i",
                "--network",
                "none",
                "--read-only",
                "--tmpfs",
                "/tmp:rw,nosuid,size=64m",
                this.runtime.image,
                ...this.runtime.command,
                request.source,
            ];

            const child = this.processRunner.run("docker", dockerArgs, {
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true,
});

            let stdout = "";
            let stderr = "";
            let settled = false;

            const timeout = setTimeout(() => {
                if (settled) {
                    return;
                }

                settled = true;
                child.kill("SIGKILL");

                resolve({
                    status: "Timeout",
                    passedTests: 0,
                    failedTests: 0,
                    testCases: [],
                });
            }, this.config.timeoutMs);

            child.stdout.on("data", (chunk: Buffer) => {
                stdout += chunk.toString("utf8");

                if (
                    Buffer.byteLength(stdout, "utf8") >
                    this.config.maxOutputBytes
                ) {
                    clearTimeout(timeout);

                    if (!settled) {
                        settled = true;
                        child.kill("SIGKILL");

                        resolve({
                            status: "Runtime Error",
                            passedTests: 0,
                            failedTests: 0,
                            testCases: [],
                        });
                    }
                }
            });

            child.stderr.on("data", (chunk: Buffer) => {
                stderr += chunk.toString("utf8");
            });

            child.on("error", (error) => {
                if (settled) {
                    return;
                }

                settled = true;
                clearTimeout(timeout);
                reject(error);
            });

            child.on("close", (code) => {
                if (settled) {
                    return;
                }

                settled = true;
                clearTimeout(timeout);

                resolve({
                    status: code === 0 ? "Passed" : "Runtime Error",
                    passedTests: code === 0 ? request.testCases.length : 0,
                    failedTests: code === 0 ? 0 : request.testCases.length,
                    testCases: request.testCases.map((testCase) => ({
                        testCaseId: testCase.id,
                        status: code === 0 ? "Passed" : "Failed",
                        actualOutput: stdout.trim(),
                        error: stderr.trim(),
                    })),
                });
            });

            child.stdin.end();
        });
    }
}