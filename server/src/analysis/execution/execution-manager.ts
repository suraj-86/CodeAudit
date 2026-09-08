import type { ExecutionRequest } from "./execution-request.js";
import type { ExecutionResult } from "./execution-result.js";

export interface ExecutionManager {
    execute(request: ExecutionRequest): Promise<ExecutionResult>;
}