import {
  PDFDocument,
  PDFFont,
  PDFPage,
  StandardFonts,
  rgb,
  type RGB,
} from "pdf-lib";

import type { ReportRenderer } from "./report-renderer.js";
import type { ReportResult } from "./report-result.js";

/*
 * Brand palette, lifted directly from the frontend's design tokens
 * (client/src/index.css's `@theme` block) so the PDF report reads as
 * the same product as the web UI, not a generic document.
 */
const COLOR = {
  ink: rgb(0x14 / 255, 0x16 / 255, 0x3a / 255),
  inkSoft: rgb(0x4b / 255, 0x4f / 255, 0x7a / 255),
  violet: rgb(0x5a / 255, 0x3c / 255, 0xf0 / 255),
  violetDeep: rgb(0x3f / 255, 0x26 / 255, 0xc4 / 255),
  marigold: rgb(0xff / 255, 0xc0 / 255, 0x2e / 255),
  coral: rgb(0xff / 255, 0x5a / 255, 0x6e / 255),
  mint: rgb(0x1f / 255, 0xcf / 255, 0x9b / 255),
  sky: rgb(0x57 / 255, 0xc7 / 255, 0xff / 255),
  paper: rgb(0xe9 / 255, 0xef / 255, 0xf5 / 255),
  grid: rgb(0xd3 / 255, 0xde / 255, 0xea / 255),
  white: rgb(1, 1, 1),
} as const;

/*
 * Status → tone, matching client/src/components/ExecutionResultView.tsx,
 * AIResultView.tsx and BatchMatrix.tsx exactly, so "Passed" is mint here
 * the same way it's mint in the app, "suspicious" is coral in both
 * places, and so on.
 */
const EXECUTION_TONE: Record<string, RGB> = {
  Passed: COLOR.mint,
  Failed: COLOR.coral,
  "Compilation Error": COLOR.coral,
  "Runtime Error": COLOR.coral,
  Timeout: COLOR.marigold,
  Unsupported: COLOR.grid,
  "Execution Unavailable": COLOR.grid,
};

const AI_LABEL_TONE: Record<string, RGB> = {
  low: COLOR.mint,
  medium: COLOR.marigold,
  high: COLOR.coral,
};

const PAGE_MARGIN = 50;
const FOOTER_HEIGHT = 34;

interface Line {
  text: string;
  size: number;
  font: PDFFont;
  color: RGB;
  gapAfter: number;
}

/**
 * Builds a professionally laid-out CodeAudit PDF report.
 *
 * The previous implementation advanced the cursor by exactly one line
 * per drawn string, regardless of how many lines pdf-lib's `maxWidth`
 * option actually wrapped that string into — so any text longer than
 * about half a page width (an AI observation, the disclaimer, even the
 * footer) silently overlapped whatever was drawn next. This version
 * measures and wraps text itself, so the vertical cursor always
 * reflects exactly what was drawn.
 */
export class PdfReportRenderer implements ReportRenderer {
  async render(report: ReportResult): Promise<Uint8Array> {
    const pdf = await PDFDocument.create();

    const regular = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);
    const mono = await pdf.embedFont(StandardFonts.Courier);

    let page = pdf.addPage();
    const { width, height } = page.getSize();
    const contentWidth = width - PAGE_MARGIN * 2;
    const contentBottom = PAGE_MARGIN + FOOTER_HEIGHT;

    let y = height - PAGE_MARGIN;

    const newPage = (): void => {
      page = pdf.addPage();
      y = height - PAGE_MARGIN;
    };

    const ensureSpace = (needed: number): void => {
      if (y - needed < contentBottom) {
        newPage();
      }
    };

    const wrap = (
      text: string,
      font: PDFFont,
      size: number,
      maxWidth: number,
    ): string[] => {
      const words = text.split(/\s+/).filter(Boolean);

      if (words.length === 0) {
        return [""];
      }

      const lines: string[] = [];
      let current = "";

      for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;

        if (
          font.widthOfTextAtSize(candidate, size) <= maxWidth ||
          !current
        ) {
          current = candidate;
        } else {
          lines.push(current);
          current = word;
        }
      }

      if (current) {
        lines.push(current);
      }

      return lines;
    };

    /** Draws left-aligned wrapped text, breaking across pages as needed. */
    const drawParagraph = (
      text: string,
      options: {
        font?: PDFFont;
        size?: number;
        color?: RGB;
        lineHeight?: number;
        maxWidth?: number;
        x?: number;
      } = {},
    ): void => {
      const font = options.font ?? regular;
      const size = options.size ?? 10;
      const color = options.color ?? COLOR.ink;
      const lineHeight = options.lineHeight ?? size * 1.5;
      const maxWidth = options.maxWidth ?? contentWidth;
      const x = options.x ?? PAGE_MARGIN;

      const lines = wrap(text, font, size, maxWidth);

      for (const line of lines) {
        ensureSpace(lineHeight);

        page.drawText(line, {
          x,
          y: y - size,
          size,
          font,
          color,
        });

        y -= lineHeight;
      }
    };

    const drawDivider = (): void => {
      ensureSpace(14);
      y -= 6;

      page.drawLine({
        start: { x: PAGE_MARGIN, y },
        end: { x: width - PAGE_MARGIN, y },
        thickness: 1,
        color: COLOR.grid,
      });

      y -= 16;
    };

    const drawSectionHeading = (text: string): void => {
      ensureSpace(40);
      y -= 4;

      page.drawRectangle({
        x: PAGE_MARGIN,
        y: y - 13,
        width: 4,
        height: 14,
        color: COLOR.violet,
      });

      page.drawText(text, {
        x: PAGE_MARGIN + 12,
        y: y - 12,
        size: 13,
        font: bold,
        color: COLOR.ink,
      });

      y -= 30;
    };

    /** A small rounded-looking pill with centered text (status/label). */
    const measurePill = (text: string, font: PDFFont, size: number) =>
      font.widthOfTextAtSize(text, size) + 16;

    const drawPill = (
      text: string,
      tone: RGB,
      x: number,
      topY: number,
      size = 9,
    ): number => {
      const pillWidth = measurePill(text, bold, size);
      const pillHeight = size + 10;

      page.drawRectangle({
        x,
        y: topY - pillHeight,
        width: pillWidth,
        height: pillHeight,
        color: tone,
        borderColor: COLOR.ink,
        borderWidth: 1,
      });

      page.drawText(text, {
        x: x + 8,
        y: topY - pillHeight + 6,
        size,
        font: bold,
        color: COLOR.ink,
      });

      return pillWidth;
    };

    /** label: value, with the label in ink-soft and value in ink. */
    const drawField = (
      label: string,
      value: string,
      options: { valueFont?: PDFFont; size?: number } = {},
    ): void => {
      const size = options.size ?? 10;
      const lineHeight = size * 1.6;
      const labelText = `${label}`;
      const labelWidth = bold.widthOfTextAtSize(labelText, size);

      const valueFont = options.valueFont ?? regular;
      const valueLines = wrap(
        value,
        valueFont,
        size,
        contentWidth - labelWidth - 10,
      );

      for (const [index, line] of valueLines.entries()) {
        ensureSpace(lineHeight);

        if (index === 0) {
          page.drawText(labelText, {
            x: PAGE_MARGIN,
            y: y - size,
            size,
            font: bold,
            color: COLOR.inkSoft,
          });
        }

        page.drawText(line, {
          x: PAGE_MARGIN + labelWidth + 10,
          y: y - size,
          size,
          font: valueFont,
          color: COLOR.ink,
        });

        y -= lineHeight;
      }
    };

    /** A left-accented callout card (used for the summary box). */
    const drawCallout = (text: string, tone: RGB): void => {
      const size = 10.5;
      const lineHeight = size * 1.6;
      const padding = 12;
      const innerWidth = contentWidth - padding * 2 - 6;
      const lines = wrap(text, regular, size, innerWidth);
      const blockHeight = lines.length * lineHeight + padding * 2;

      ensureSpace(blockHeight + 10);

      const top = y;

      page.drawRectangle({
        x: PAGE_MARGIN,
        y: top - blockHeight,
        width: contentWidth,
        height: blockHeight,
        color: COLOR.paper,
      });

      page.drawRectangle({
        x: PAGE_MARGIN,
        y: top - blockHeight,
        width: 5,
        height: blockHeight,
        color: tone,
      });

      let lineY = top - padding;

      for (const line of lines) {
        page.drawText(line, {
          x: PAGE_MARGIN + padding + 6,
          y: lineY - size,
          size,
          font: regular,
          color: COLOR.ink,
        });

        lineY -= lineHeight;
      }

      y = top - blockHeight - 14;
    };

    /** A thin horizontal meter bar for a 0-1 ratio, with a threshold tick. */
    const drawMeter = (
      ratio: number,
      threshold: number | undefined,
      tone: RGB,
    ): void => {
      const barHeight = 10;
      const barWidth = contentWidth;

      ensureSpace(barHeight + 18);

      const top = y;

      page.drawRectangle({
        x: PAGE_MARGIN,
        y: top - barHeight,
        width: barWidth,
        height: barHeight,
        color: COLOR.paper,
        borderColor: COLOR.ink,
        borderWidth: 1,
      });

      const filled = Math.max(
        0,
        Math.min(1, ratio),
      );

      if (filled > 0) {
        page.drawRectangle({
          x: PAGE_MARGIN,
          y: top - barHeight,
          width: barWidth * filled,
          height: barHeight,
          color: tone,
          borderColor: COLOR.ink,
          borderWidth: 1,
        });
      }

      if (threshold !== undefined) {
        const tickX =
          PAGE_MARGIN + barWidth * Math.max(0, Math.min(1, threshold));

        page.drawLine({
          start: { x: tickX, y: top + 3 },
          end: { x: tickX, y: top - barHeight - 3 },
          thickness: 1.5,
          color: COLOR.ink,
          dashArray: [2, 2],
        });
      }

      y = top - barHeight - 16;
    };

    // ---------------------------------------------------------------
    // Header
    // ---------------------------------------------------------------

    page.drawText("CODEAUDIT", {
      x: PAGE_MARGIN,
      y: y - 14,
      size: 11,
      font: bold,
      color: COLOR.violet,
    });

    y -= 24;

    page.drawText(report.title, {
      x: PAGE_MARGIN,
      y: y - 22,
      size: 22,
      font: bold,
      color: COLOR.ink,
    });

    y -= 38;

    drawField("Report ID", report.reportId, {
      valueFont: mono,
      size: 9,
    });
    drawField(
      "Generated",
      new Date(report.generatedAt).toUTCString(),
      { size: 9 },
    );

    drawDivider();

    // ---------------------------------------------------------------
    // Summary
    // ---------------------------------------------------------------

    drawSectionHeading("Summary");
    drawCallout(report.summary, COLOR.violet);

    // ---------------------------------------------------------------
    // Analyzed files
    // ---------------------------------------------------------------

    drawSectionHeading("Analyzed Files");

    for (const file of report.input.sourceFiles) {
      ensureSpace(60);

      page.drawText(file.filename, {
        x: PAGE_MARGIN,
        y: y - 12,
        size: 11.5,
        font: bold,
        color: COLOR.ink,
      });

      y -= 20;

      if (file.language) {
        drawField("Language", file.language, { size: 9 });
      }

      if (file.sha256) {
        drawField("SHA-256", file.sha256, {
          valueFont: mono,
          size: 8,
        });
      }

      y -= 10;
    }

    // ---------------------------------------------------------------
    // Correctness
    // ---------------------------------------------------------------

    if (report.input.correctness) {
      const correctness = report.input.correctness;

      drawSectionHeading("Correctness");

      const sourceTone =
        EXECUTION_TONE[correctness.source.status] ?? COLOR.grid;

      drawPill(
        `Submission: ${correctness.source.status}`,
        sourceTone,
        PAGE_MARGIN,
        y,
      );

      y -= 30;

      drawField(
        "Tests",
        `${correctness.source.passedTests} passed, ${correctness.source.failedTests} failed`,
      );

      if (correctness.source.executionTimeMs !== undefined) {
        drawField(
          "Execution time",
          `${correctness.source.executionTimeMs} ms`,
        );
      }

      if (correctness.comparison) {
        y -= 6;

        const comparisonTone =
          EXECUTION_TONE[correctness.comparison.status] ?? COLOR.grid;

        drawPill(
          `Reference: ${correctness.comparison.status}`,
          comparisonTone,
          PAGE_MARGIN,
          y,
        );

        y -= 30;
      }

      y -= 4;
    }

    // ---------------------------------------------------------------
    // Structural similarity
    // ---------------------------------------------------------------

    if (report.input.similarity) {
      const similarity = report.input.similarity;

      drawSectionHeading("Structural Similarity");

      page.drawText(
        `${(similarity.similarity * 100).toFixed(2)}%`,
        {
          x: PAGE_MARGIN,
          y: y - 26,
          size: 26,
          font: bold,
          color: COLOR.ink,
        },
      );

      const suspiciousTone = similarity.suspicious
        ? COLOR.coral
        : COLOR.mint;

      drawPill(
        similarity.suspicious ? "Suspicious" : "Not suspicious",
        suspiciousTone,
        PAGE_MARGIN + 150,
        y,
      );

      y -= 40;

      drawMeter(
        similarity.similarity,
        similarity.threshold,
        similarity.suspicious ? COLOR.coral : COLOR.mint,
      );

      drawField(
        "Threshold",
        `${(similarity.threshold * 100).toFixed(2)}%`,
        { size: 9 },
      );

      y -= 4;
    }

    // ---------------------------------------------------------------
    // AI-assisted analysis
    // ---------------------------------------------------------------

    if (report.input.aiAnalysis) {
      const ai = report.input.aiAnalysis;

      drawSectionHeading("AI-Assisted Analysis");

      if (ai.available) {
        const labelTone =
          AI_LABEL_TONE[ai.label.toLowerCase()] ?? COLOR.grid;

        const pillWidth = drawPill(
          ai.label.toUpperCase(),
          labelTone,
          PAGE_MARGIN,
          y,
        );

        const stats: string[] = [];

        if (ai.indicator !== undefined) {
          stats.push(`indicator ${(ai.indicator * 100).toFixed(0)}%`);
        }

        if (ai.confidence !== undefined) {
          stats.push(`confidence ${(ai.confidence * 100).toFixed(0)}%`);
        }

        if (stats.length > 0) {
          page.drawText(stats.join(" · "), {
            x: PAGE_MARGIN + pillWidth + 10,
            y: y - 14,
            size: 9,
            font: regular,
            color: COLOR.inkSoft,
          });
        }

        y -= 28;
        drawField("Provider", ai.provider, { size: 9 });
        y -= 6;

        for (const observation of ai.observations) {
          ensureSpace(18);

          page.drawRectangle({
            x: PAGE_MARGIN,
            y: y - 14,
            width: 3,
            height: 14,
            color: COLOR.sky,
          });

          const label = `${observation.category}: `;
          const labelWidth = bold.widthOfTextAtSize(label, 9.5);

          ensureSpace(14);

          page.drawText(label, {
            x: PAGE_MARGIN + 10,
            y: y - 11,
            size: 9.5,
            font: bold,
            color: COLOR.ink,
          });

          const descLines = wrap(
            observation.description,
            regular,
            9.5,
            contentWidth - 10 - labelWidth,
          );

          for (const [index, line] of descLines.entries()) {
            if (index > 0) {
              ensureSpace(14);
            }

            page.drawText(line, {
              x: PAGE_MARGIN + 10 + labelWidth,
              y: y - 11,
              size: 9.5,
              font: regular,
              color: COLOR.ink,
            });

            y -= 14;
          }

          y -= 4;
        }

        if (ai.disclaimer) {
          y -= 4;
          drawParagraph(ai.disclaimer, {
            font: italic,
            size: 8.5,
            color: COLOR.inkSoft,
            lineHeight: 12,
          });
        }
      } else {
        drawField("Available", "No");

        if (ai.error) {
          drawField("Reason", ai.error);
        }
      }

      y -= 6;
    }

    // ---------------------------------------------------------------
    // Evidence log
    // ---------------------------------------------------------------

    if (report.input.evidence && report.input.evidence.length > 0) {
      drawSectionHeading("Evidence Log");

      for (const evidence of report.input.evidence) {
        ensureSpace(20);

        const tagText = evidence.category.toUpperCase();
        const tagWidth = measurePill(tagText, bold, 7.5);

        page.drawRectangle({
          x: PAGE_MARGIN,
          y: y - 14,
          width: tagWidth,
          height: 14,
          color: COLOR.marigold,
          borderColor: COLOR.ink,
          borderWidth: 0.75,
        });

        page.drawText(tagText, {
          x: PAGE_MARGIN + 8,
          y: y - 10.5,
          size: 7.5,
          font: bold,
          color: COLOR.ink,
        });

        const descX = PAGE_MARGIN + tagWidth + 10;
        const descLines = wrap(
          evidence.description,
          regular,
          9.5,
          contentWidth - tagWidth - 10,
        );

        for (const [index, line] of descLines.entries()) {
          if (index > 0) {
            ensureSpace(14);
          }

          page.drawText(line, {
            x: descX,
            y: y - 10.5,
            size: 9.5,
            font: regular,
            color: COLOR.ink,
          });

          y -= 14;
        }

        y -= 6;
      }
    }

    // ---------------------------------------------------------------
    // Disclaimer
    // ---------------------------------------------------------------

    if (report.input.disclaimer) {
      drawSectionHeading("Disclaimer");
      drawCallout(report.input.disclaimer, COLOR.inkSoft);
    }

    // ---------------------------------------------------------------
    // Footer — drawn last, once per page, now that the final page
    // count is known, so "page X of Y" is always accurate and the
    // footer can never collide with content (it lives in the reserved
    // FOOTER_HEIGHT band every ensureSpace() check already respects).
    // ---------------------------------------------------------------

    const pages = pdf.getPages();

    pages.forEach((footerPage, index) => {
      const footerY = PAGE_MARGIN - 6;

      footerPage.drawLine({
        start: { x: PAGE_MARGIN, y: footerY + 16 },
        end: { x: width - PAGE_MARGIN, y: footerY + 16 },
        thickness: 1,
        color: COLOR.grid,
      });

      footerPage.drawText(
        "CodeAudit — independent analytical signals, not a verdict.",
        {
          x: PAGE_MARGIN,
          y: footerY,
          size: 7.5,
          font: regular,
          color: COLOR.inkSoft,
        },
      );

      const pageLabel = `Page ${index + 1} of ${pages.length}`;
      const pageLabelWidth = regular.widthOfTextAtSize(pageLabel, 7.5);

      footerPage.drawText(pageLabel, {
        x: width - PAGE_MARGIN - pageLabelWidth,
        y: footerY,
        size: 7.5,
        font: regular,
        color: COLOR.inkSoft,
      });
    });

    return pdf.save();
  }
}
