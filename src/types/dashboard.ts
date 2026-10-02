import { CaseStatus } from "./case";

export interface DashboardStatusCounts {
  DRAFT: number;
  AI_ANALYSIS: number;
  CHECKING: number;
  SIGNING: number;
  EXECUTION: number;
  DONE: number;
  CLOSED: number;
  ESCALATION_REQUIRED: number;
}

export interface DashboardSummaryData {
  my_cases: number;
  need_my_review: number;
  need_my_signature: number;
  need_my_execution: number;
  status_counts: DashboardStatusCounts;
}
