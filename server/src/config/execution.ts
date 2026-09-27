import type { ExecutionConfig } from "../analysis/execution/execution-config.js";
import type { ExecutionRuntime } from "../analysis/execution/execution-manager.js";

/**
 * Production execution configuration. Values are environment-overridable
 * so deployment can tune limits without a code change, but always fall
 * back to safe, conservative defaults.
 */
export const EXECUTION_CONFIG: ExecutionConfig = {
    timeoutMs: Number(process.env.EXECUTION_TIMEOUT_MS) || 5000,
    maxOutputBytes:
        Number(process.env.EXECUTION_MAX_OUTPUT_BYTES) || 64 * 1024,
    networkDisabled: true,
};

/**
 * Runtime image/command pair for the Python execution worker.
 * Matches server/runtime/python (Dockerfile + runner.py).
 */
export const PYTHON_RUNTIME: ExecutionRuntime = {
    image: "codeaudit/python",
    command: ["python", "/runner.py"],
};
