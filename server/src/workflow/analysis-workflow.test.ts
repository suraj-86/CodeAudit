import assert from "node:assert/strict";
import test from "node:test";

import type { ExecutionManager } from "../analysis/execution/execution-manager.js";
import type { ExecutionRequest } from "../analysis/execution/execution-request.js";
import type { ExecutionResult } from "../analysis/execution/execution-result.js";
import type { AIAnalysisProvider } from "../analysis/ai/ai-analysis-provider.js";
import { AIAnalysisService } from "../analysis/ai/ai-analysis-service.js";
import type { AIAnalysisRequest } from "../analysis/ai/ai-analysis-request.js";
import type { AIAnalysisResult } from "../analysis/ai/ai-analysis-result.js";

import {
    AnalysisWorkflowOrchestrator,
    type WorkflowSourceFile,
} from "./analysis-workflow.js";

const PASSING_EXECUTION_RESULT: ExecutionResult = {
    status: "Passed",
    passedTests: 1,
    failedTests: 0,
    testCases: [
        {
            testCaseId: "case-1",
            status: "Passed",
            actualOutput: "5",
        },
    ],
};

const AVAILABLE_AI_RESULT: AIAnalysisResult = {
    available: true,
    provider: "fake",
    indicator: 0.42,
    label: "medium",
    confidence: 0.8,
    observations: [],
    disclaimer: "test disclaimer",
};

function fakeExecutionManager(
    result: ExecutionResult = PASSING_EXECUTION_RESULT,
): ExecutionManager {
    return {
        async execute(
            _request: ExecutionRequest,
        ): Promise<ExecutionResult> {
            return result;
        },
    };
}

function fakeAIAnalysisService(
    result: AIAnalysisResult = AVAILABLE_AI_RESULT,
): AIAnalysisService {
    const provider: AIAnalysisProvider = {
        async analyze(
            _request: AIAnalysisRequest,
        ): Promise<AIAnalysisResult> {
            return result;
        },
    };

    return new AIAnalysisService(provider);
}

function cppFile(
    filename: string,
    source: string,
): WorkflowSourceFile {
    return {
        filename,
        language: "cpp",
        source: Buffer.from(source, "utf8"),
    };
}

test("runs exact-match and structural analysis when a C++ reference is provided", async () => {
    const orchestrator = new AnalysisWorkflowOrchestrator(
        fakeExecutionManager(),
        fakeAIAnalysisService(),
    );

    const result = await orchestrator.run({
        source: cppFile(
            "submission.cpp",
            "int add(int a, int b) { return a + b; }",
        ),
        reference: cppFile(
            "reference.cpp",
            "int add(int x, int y) { return x + y; }",
        ),
        runAI: false,
    });

    assert.ok(result.similarity);
    assert.equal(result.similarity?.similarity, 1);
    assert.equal(result.sourceFiles.length, 2);
    assert.ok(
        result.evidence.some((item) =>
            item.category === "Exact Match",
        ),
    );
    assert.ok(
        result.warnings.some((warning) =>
            warning.includes("AI-assisted analysis skipped"),
        ),
    );
});

test("runs structural analysis for Python submissions too, not just C++", async () => {
    const orchestrator = new AnalysisWorkflowOrchestrator(
        fakeExecutionManager(),
        fakeAIAnalysisService(),
    );

    const result = await orchestrator.run({
        source: {
            filename: "submission.py",
            language: "python",
            source: Buffer.from(
                "def add(a, b):\n    return a + b\n",
                "utf8",
            ),
        },
        reference: {
            filename: "reference.py",
            language: "python",
            source: Buffer.from(
                "def add(x, y):\n    return x + y\n",
                "utf8",
            ),
        },
        runAI: false,
    });

    assert.ok(result.similarity);
    assert.equal(result.similarity?.similarity, 1);
});

test("skips structural analysis for a genuinely unsupported language instead of misparsing", async () => {
    const orchestrator = new AnalysisWorkflowOrchestrator(
        fakeExecutionManager(),
        fakeAIAnalysisService(),
    );

    const result = await orchestrator.run({
        source: {
            filename: "submission.cobol",
            language: "cobol",
            source: Buffer.from("DISPLAY 'HI'.", "utf8"),
        },
        reference: {
            filename: "reference.cobol",
            language: "cobol",
            source: Buffer.from("DISPLAY 'HI'.", "utf8"),
        },
        runAI: false,
    });

    assert.equal(result.similarity, undefined);
    assert.ok(
        result.warnings.some((warning) =>
            warning.includes("not supported for this language"),
        ),
    );
});

test("skips structural analysis when the submission and reference are different languages", async () => {
    const orchestrator = new AnalysisWorkflowOrchestrator(
        fakeExecutionManager(),
        fakeAIAnalysisService(),
    );

    const result = await orchestrator.run({
        source: {
            filename: "submission.py",
            language: "python",
            source: Buffer.from("print(1)", "utf8"),
        },
        reference: {
            filename: "reference.java",
            language: "java",
            source: Buffer.from(
                "class Main { public static void main(String[] a) {} }",
                "utf8",
            ),
        },
        runAI: false,
    });

    assert.equal(result.similarity, undefined);
    assert.ok(
        result.warnings.some((warning) =>
            warning.includes("different languages"),
        ),
    );
});

test("runs correctness testing for Python submissions with test cases", async () => {
    const orchestrator = new AnalysisWorkflowOrchestrator(
        fakeExecutionManager(PASSING_EXECUTION_RESULT),
        fakeAIAnalysisService(),
    );

    const result = await orchestrator.run({
        source: {
            filename: "submission.py",
            language: "python",
            source: Buffer.from("print(5)", "utf8"),
        },
        testCases: [
            { id: "case-1", input: "", expectedOutput: "5" },
        ],
        runAI: false,
    });

    assert.ok(result.correctness);
    assert.equal(result.correctness?.source.status, "Passed");
    assert.equal(result.correctness?.comparison, undefined);
});

test("skips correctness testing for non-Python languages", async () => {
    const orchestrator = new AnalysisWorkflowOrchestrator(
        fakeExecutionManager(),
        fakeAIAnalysisService(),
    );

    const result = await orchestrator.run({
        source: cppFile(
            "submission.cpp",
            "int main() { return 0; }",
        ),
        testCases: [
            { id: "case-1", input: "", expectedOutput: "0" },
        ],
        runAI: false,
    });

    assert.equal(result.correctness, undefined);
    assert.ok(
        result.warnings.some((warning) =>
            warning.includes("Python only"),
        ),
    );
});

test("includes AI analysis by default and records it as evidence", async () => {
    const orchestrator = new AnalysisWorkflowOrchestrator(
        fakeExecutionManager(),
        fakeAIAnalysisService(AVAILABLE_AI_RESULT),
    );

    const result = await orchestrator.run({
        source: cppFile(
            "submission.cpp",
            "int main() { return 0; }",
        ),
    });

    assert.equal(result.aiAnalysis?.available, true);
    assert.ok(
        result.evidence.some((item) =>
            item.category === "AI-Assisted Analysis",
        ),
    );
});

test("never lets an AI provider failure break the overall workflow", async () => {
    const failingAIAnalysisService = new AIAnalysisService({
        async analyze(): Promise<AIAnalysisResult> {
            throw new Error("provider exploded");
        },
    });

    const orchestrator = new AnalysisWorkflowOrchestrator(
        fakeExecutionManager(),
        failingAIAnalysisService,
    );

    const result = await orchestrator.run({
        source: cppFile(
            "submission.cpp",
            "int main() { return 0; }",
        ),
    });

    assert.equal(result.aiAnalysis?.available, false);
    assert.ok(
        result.warnings.some((warning) =>
            warning.includes("provider exploded"),
        ),
    );
});
