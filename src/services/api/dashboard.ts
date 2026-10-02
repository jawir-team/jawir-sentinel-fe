import { apiGet } from "./client";
import { DashboardSummaryData } from "@/types/dashboard";

const mockSummary: DashboardSummaryData = {
  my_cases: 3,
  need_my_review: 1,
  need_my_signature: 1,
  need_my_execution: 1,
  status_counts: {
    DRAFT: 1,
    AI_ANALYSIS: 0,
    CHECKING: 1,
    SIGNING: 1,
    EXECUTION: 0,
    DONE: 0,
    CLOSED: 0,
    ESCALATION_REQUIRED: 0,
  },
};

export async function getDashboardSummary(): Promise<DashboardSummaryData> {
  try {
    const res = await apiGet<
      DashboardSummaryData | { data: DashboardSummaryData }
    >("/dashboard/summary");
    if (res && "data" in res && !("my_cases" in res)) {
      return (res as { data: DashboardSummaryData }).data;
    }
    return res as DashboardSummaryData;
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "status" in err &&
      (err as { status?: number }).status === 401
    ) {
      throw err;
    }
    return mockSummary;
  }
}
