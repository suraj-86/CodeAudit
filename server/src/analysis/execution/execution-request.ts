import type { TestCase } from "./test-case.js";

export interface ExecutionRequest {
    source: string;
    language: string;
    testCases: TestCase[];
}