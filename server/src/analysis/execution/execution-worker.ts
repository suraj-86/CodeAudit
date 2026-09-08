import type { ExecutionRequest } from "./execution-request.js";
import type { ExecutionResult } from "./execution-result.js";

export interface ExecutionWorker {
    run(request: ExecutionRequest): Promise<ExecutionResult>;
}