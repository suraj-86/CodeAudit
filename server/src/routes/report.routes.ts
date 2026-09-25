import { Router } from "express";

import { ReportService } from "../reporting/report-service.js";
import { PdfReportRenderer } from "../reporting/pdf-report-renderer.js";
import type { ReportInput } from "../reporting/report-input.js";
import { validateReportInput } from "../validation/report-validation.js";

const router = Router();

const reportService = new ReportService();
const reportRenderer = new PdfReportRenderer();

router.post("/reports", async (req, res) => {
  const validation = validateReportInput(req.body);

  if (!validation.valid) {
    return res.status(400).json({
      error: {
        code: "REPORT_INPUT_INVALID",
        message: validation.reason ?? "Invalid report input.",
        details: null,
      },
    });
  }

  const input = req.body as ReportInput;

  try {
    const report = reportService.generateReport(input);
    const pdf = await reportRenderer.render(report);

    res.status(200);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="codeaudit-report-${report.reportId}.pdf"`,
    );
    res.setHeader("Content-Length", pdf.length);

    return res.send(Buffer.from(pdf));
  } catch {
    return res.status(500).json({
      error: {
        code: "REPORT_GENERATION_FAILED",
        message: "Report generation failed.",
        details: null,
      },
    });
  }
});

export default router;