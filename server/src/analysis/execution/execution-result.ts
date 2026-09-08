export type ExecutionStatus =
    | "Passed"
    | "Failed"
    | "Compilation Error"
    | "Runtime Error"
    | "Timeout"
    | "Unsupported"
    | "Execution Unavailable";

export interface TestCaseResult {
    testCaseId: string;
    status: ExecutionStatus;
    actualOutput?: string;
    error?: string;
    executionTimeMs?: number;
}

export interface ExecutionResult {
    status: ExecutionStatus;
    passedTests: number;
    failedTests: number;
    testCases: TestCaseResult[];
    executionTimeMs?: number;
}