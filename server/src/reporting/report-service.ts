import type { ReportInput } from "./report-input.js";
import type { ReportResult } from "./report-result.js";

export class ReportService {
  generateReport(input: ReportInput): ReportResult {
    const generatedAt = input.generatedAt ?? new Date().toISOString();

    return {
      reportId: crypto.randomUUID(),
      input,
      title: input.projectName
        ? `CodeAudit Report — ${input.projectName}`
        : "CodeAudit Analysis Report",
      summary: this.buildSummary(input),
      generatedAt,
    };
  }

  private buildSummary(input: ReportInput): string {
    const sections: string[] = [];

    sections.push(`Source files analyzed: ${input.sourceFiles.length}.`);

    if (input.correctness) {
      sections.push(
        `Correctness status: ${input.correctness.source.status}.`,
      );
    }

    if (input.similarity) {
      sections.push(
        `Structural similarity: ${(input.similarity.similarity * 100).toFixed(2)}%.`,
      );
    }

    if (input.aiAnalysis) {
      if (
        input.aiAnalysis.available &&
        input.aiAnalysis.indicator !== undefined
      ) {
        sections.push(
          `AI-assisted indicator: ${(input.aiAnalysis.indicator * 100).toFixed(2)}%.`,
        );
      } else {
        sections.push("AI-assisted analysis: unavailable.");
      }
    }

    if (input.evidence && input.evidence.length > 0) {
      sections.push(
        `Evidence items: ${input.evidence.length}.`,
      );
    }

    if (input.disclaimer) {
      sections.push("Report limitations and disclaimer are provided.");
    }

    return sections.join(" ");
  }
}