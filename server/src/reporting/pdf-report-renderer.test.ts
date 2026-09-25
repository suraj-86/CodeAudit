import test from "node:test";
import assert from "node:assert/strict";

import { PdfReportRenderer } from "./pdf-report-renderer.js";
import type { ReportResult } from "./report-result.js";

test("PdfReportRenderer generates a PDF document", async () => {
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