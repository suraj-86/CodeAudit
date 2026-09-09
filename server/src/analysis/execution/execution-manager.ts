import type { ExecutionConfig } from "./execution-config.js";
import type { ExecutionRequest } from "./execution-request.js";
import type { ExecutionResult } from "./execution-result.js";
import { DockerExecutionWorker } from "./docker-worker.js";
import { NodeProcessRunner } from "./node-process-runner.js";
import type { ExecutionWorker } from "./execution-worker.js";

export interface ExecutionManager {
    execute(
        request: ExecutionRequest,
    ): Promise<ExecutionResult>;
}

export interface ExecutionRuntime {
    image: string;
    command: string[];
}

export class DefaultExecutionManager
    implements ExecutionManager
{
    constructor(
        private readonly workers: ReadonlyMap<
            string,
            ExecutionWorker
        >,
    ) {}

    async execute(
        request: ExecutionRequest,
    ): Promise<ExecutionResult> {
        const worker = this.workers.get(
            request.language,
        );

        if (!worker) {
            return {
                status: "Unsupported",
                passedTests: 0,
                failedTests: request.testCases.length,
                testCases: request.testCases.map(
                    (testCase) => ({
                        testCaseId: testCase.id,
                        status: "Unsupported",
                        error:
                            `No execution worker is available ` +
                            `for language "${request.language}".`,
                    }),
                ),
            };
        }

        return worker.run(request);
    }
}

export function createDefaultExecutionManager(
    config: ExecutionConfig,
    runtime: ExecutionRuntime,
    processRunner = new NodeProcessRunner(),
): ExecutionManager {
    const pythonWorker =
        new DockerExecutionWorker(
            config,
            runtime,
            processRunner,
        );

    const workers = new Map<
        string,
        ExecutionWorker
    >([
        ["python", pythonWorker],
    ]);

    return new DefaultExecutionManager(
        workers,
    );
}