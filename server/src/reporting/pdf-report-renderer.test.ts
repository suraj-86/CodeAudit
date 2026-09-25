import test from "node:test";
import assert from "node:assert/strict";

import { PdfReportRenderer } from "./pdf-report-renderer.js";
import type { ReportResult } from "./report-result.js";

test("PdfReportRenderer generates a complete PDF report", async () => {
  const renderer = new PdfReportRenderer();

  const report: ReportResult = {
    reportId: "12345678-1234-1234-1234-123456789abc",
    title: "CodeAudit Analysis Report",
    summary: "Source files analyzed: 1.",
    generatedAt: "2026-09-25T00:00:00.000Z",
    input: {
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
        disclaimer:
          "AI analysis is an indicator and not proof of authorship.",
      },

      evidence: [
        {
          category: "similarity",
          description:
            "The submitted files share a suspicious structural pattern.",
        },
      ],

      disclaimer:
        "Analysis results are indicators and should not be interpreted as proof of authorship.",
    },
  };

  const pdf = await renderer.render(report);

  assert.ok(pdf instanceof Uint8Array);
  assert.ok(pdf.length > 0);

  const header = new TextDecoder().decode(
    pdf.slice(0, 5),
  );

  assert.equal(header, "%PDF-");
});