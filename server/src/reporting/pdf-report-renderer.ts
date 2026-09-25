import {
  PDFDocument,
  StandardFonts,
  rgb,
} from "pdf-lib";

import type { ReportRenderer } from "./report-renderer.js";
import type { ReportResult } from "./report-result.js";

export class PdfReportRenderer implements ReportRenderer {
  async render(report: ReportResult): Promise<Uint8Array> {
    const pdf = await PDFDocument.create();

    const regularFont = await pdf.embedFont(
      StandardFonts.Helvetica,
    );

    const boldFont = await pdf.embedFont(
      StandardFonts.HelveticaBold,
    );

    let page = pdf.addPage();
    const { width, height } = page.getSize();

    const margin = 50;
    const contentWidth = width - margin * 2;

    let y = height - margin;

    const lineHeight = 16;

    const addPageIfNeeded = (requiredHeight: number) => {
      if (y - requiredHeight < margin) {
        page = pdf.addPage();
        y = height - margin;
      }
    };

    const drawText = (
      text: string,
      options?: {
        font?: typeof regularFont;
        size?: number;
      },
    ) => {
      const font = options?.font ?? regularFont;
      const size = options?.size ?? 10;

      page.drawText(text, {
        x: margin,
        y,
        size,
        font,
        color: rgb(0, 0, 0),
        maxWidth: contentWidth,
      });

      y -= lineHeight;
    };

    const drawHeading = (text: string) => {
      addPageIfNeeded(30);

      page.drawText(text, {
        x: margin,
        y,
        size: 15,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      y -= 24;
    };

    const drawLabelValue = (
      label: string,
      value: string,
    ) => {
      addPageIfNeeded(lineHeight);

      page.drawText(`${label}: ${value}`, {
        x: margin,
        y,
        size: 10,
        font: regularFont,
        color: rgb(0, 0, 0),
        maxWidth: contentWidth,
      });

      y -= lineHeight;
    };

    // Title
    page.drawText(report.title, {
      x: margin,
      y,
      size: 20,
      font: boldFont,
      color: rgb(0, 0, 0),
      maxWidth: contentWidth,
    });

    y -= 30;

    drawLabelValue("Report ID", report.reportId);
    drawLabelValue("Generated", report.generatedAt);

    y -= 10;

    // Summary
    drawHeading("Summary");
    drawText(report.summary);

    y -= 10;

    // Source files
    drawHeading("Analyzed Files");

    for (const file of report.input.sourceFiles) {
      drawLabelValue("File", file.filename);

      if (file.language) {
        drawLabelValue("Language", file.language);
      }

      if (file.sha256) {
        drawLabelValue("SHA-256", file.sha256);
      }

      y -= 4;
    }

    // Correctness
    if (report.input.correctness) {
      drawHeading("Correctness");

      const correctness = report.input.correctness;

      drawLabelValue(
        "Source status",
        correctness.source.status,
      );

      drawLabelValue(
        "Passed tests",
        String(correctness.source.passedTests),
      );

      drawLabelValue(
        "Failed tests",
        String(correctness.source.failedTests),
      );

      if (
        correctness.source.executionTimeMs !== undefined
      ) {
        drawLabelValue(
          "Execution time",
          `${correctness.source.executionTimeMs} ms`,
        );
      }

      if (correctness.comparison) {
        drawLabelValue(
          "Comparison status",
          correctness.comparison.status,
        );
      }
    }

    // Structural similarity
    if (report.input.similarity) {
      drawHeading("Structural Similarity");

      const similarity = report.input.similarity;

      drawLabelValue(
        "Similarity",
        `${(similarity.similarity * 100).toFixed(2)}%`,
      );

      drawLabelValue(
        "Threshold",
        `${(similarity.threshold * 100).toFixed(2)}%`,
      );

      drawLabelValue(
        "Suspicious",
        similarity.suspicious ? "Yes" : "No",
      );
    }

    // AI analysis
    if (report.input.aiAnalysis) {
      drawHeading("AI-Assisted Analysis");

      const ai = report.input.aiAnalysis;

      drawLabelValue(
        "Available",
        ai.available ? "Yes" : "No",
      );

      drawLabelValue("Provider", ai.provider);
      drawLabelValue("Label", ai.label);

      if (ai.indicator !== undefined) {
        drawLabelValue(
          "Indicator",
          `${(ai.indicator * 100).toFixed(2)}%`,
        );
      }

      if (ai.confidence !== undefined) {
        drawLabelValue(
          "Confidence",
          `${(ai.confidence * 100).toFixed(2)}%`,
        );
      }

      for (const observation of ai.observations) {
        addPageIfNeeded(32);

        drawLabelValue(
          "Observation",
          `[${observation.category}] ${observation.description}`,
        );
      }

      if (ai.disclaimer) {
        y -= 4;
        drawLabelValue("Disclaimer", ai.disclaimer);
      }
    }

    // Footer
    addPageIfNeeded(30);

    y -= 12;

    page.drawText(
      "CodeAudit — analysis results are informational and should be interpreted within their documented limitations.",
      {
        x: margin,
        y,
        size: 8,
        font: regularFont,
        color: rgb(0, 0, 0),
        maxWidth: contentWidth,
      },
    );

    return pdf.save();
  }
}