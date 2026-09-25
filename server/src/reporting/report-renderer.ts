import type { ReportResult } from "./report-result.js";

export interface ReportRenderer {
  render(report: ReportResult): Promise<Uint8Array>;
}