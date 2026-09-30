import type { ExecutionConfig } from "../analysis/execution/execution-config.js";
import type { ExecutionRuntime } from "../analysis/execution/execution-manager.js";

export const EXECUTION_CONFIG: ExecutionConfig = {
    timeoutMs: Number(process.env.EXECUTION_TIMEOUT_MS) || 5000,
    maxOutputBytes:
        Number(process.env.EXECUTION_MAX_OUTPUT_BYTES) || 64 * 1024,
    networkDisabled: true,
};


export const PYTHON_RUNTIME: ExecutionRuntime = {
    image: "codeaudit/python",
    command: ["python", "/runner.py"],
};
