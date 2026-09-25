import test from "node:test";
import assert from "node:assert/strict";

import { ReportService } from "./report-service.js";
import type { ReportInput } from "./report-input.js";

test("ReportService generates a coherent report", () => {
  const service = new ReportService();

  const input: ReportInput = {
    projectName: "Example Project",
    sourceFiles: [
      {
        filename: "main.cpp",
        language: "cpp",
        sha256: "abc123",
      },
    ],
    correctness: {
      source: {
        status: "Passed",
        passedTests: 2,
        failedTests: 0,
        testCases: [],
      },
    },
    similarity: {
      similarity: 0.25,
      threshold: 0.7,
      suspicious: false,
    },
    aiAnalysis: {
      available: true,
      provider: "test-provider",
      indicator: 0.4,
      label: "medium",
      confidence: 0.8,
      observations: [
        {
          category: "structure",
          description: "Example observation",
        },
      ],
      disclaimer: "AI analysis is an indicator and not proof of authorship.",
    },

        evidence: [
      {
        category: "similarity",
        description: "The submitted files share a suspicious structural pattern.",
      },
    ],

    disclaimer:
      "Analysis results are indicators and should not be interpreted as proof of authorship.",
  };

  const result = service.generateReport(input);

  assert.match(result.reportId, /^[0-9a-f-]{36}$/);
  assert.equal(result.title, "CodeAudit Report — Example Project");
  assert.equal(result.input, input);
  assert.equal(result.generatedAt.length > 0, true);

  assert.match(
    result.summary,
    /Source files analyzed: 1/,
  );

  assert.match(
    result.summary,
    /Correctness status: Passed/,
  );

  assert.match(
    result.summary,
    /Structural similarity: 25\.00%/,
  );

  assert.match(
    result.summary,
    /AI-assisted indicator: 40\.00%/,
  );

    assert.match(
    result.summary,
    /Evidence items: 1/,
  );

  assert.match(
    result.summary,
    /Report limitations and disclaimer are provided/,
  );
});