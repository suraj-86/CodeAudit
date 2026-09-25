import type { ReportInput } from "./report-input.js";

export interface ReportResult {
  reportId: string;
  input: ReportInput;
  title: string;
  summary: string;
  generatedAt: string;
}