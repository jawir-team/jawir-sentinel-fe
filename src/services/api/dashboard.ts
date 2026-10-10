import { apiGet, shouldUseApiFallback } from "./client";
import { DashboardSummaryData } from "@/types/dashboard";
import { getMockCases } from "./cases";
import { getActiveMockUser } from "@/mocks/mockSession";

function getMockSummary(): DashboardSummaryData {
  const actor = getActiveMockUser();
  const accessibleCases = getMockCases().filter(
    (caseItem) =>
      actor.system_role === "ADMIN" ||
      caseItem.participants.some(
        (participant) =>
          participant.user_id === actor.id && participant.status === "ACTIVE"
      )
  );
  const hasRole = (caseId: string, role: string) =>
    accessibleCases
      .find((caseItem) => caseItem.id === caseId)
      ?.participants.some(
        (participant) =>
          participant.user_id === actor.id &&
          participant.role === role &&
          participant.status === "ACTIVE"
      ) ?? false;

  const statusCounts: DashboardSummaryData["status_counts"] = {
    DRAFT: 0,
    SUBMITTED: 0,
    AI_ANALYSIS: 0,
    CHECKING: 0,
    SIGNING: 0,
    EXECUTION: 0,
    DONE: 0,
    CLOSED: 0,
    ESCALATION_REQUIRED: 0,
  };
  accessibleCases.forEach((caseItem) => {
    statusCounts[caseItem.status] += 1;
  });

  return {
    my_cases: accessibleCases.length,
    need_my_review: accessibleCases.filter(
      (caseItem) =>
        caseItem.status === "CHECKING" && hasRole(caseItem.id, "CHECKER")
    ).length,
    need_my_signature: accessibleCases.filter(
      (caseItem) =>
        caseItem.status === "SIGNING" && hasRole(caseItem.id, "SIGNER")
    ).length,
    need_my_execution: accessibleCases.filter(
      (caseItem) =>
        caseItem.status === "EXECUTION" && hasRole(caseItem.id, "EXECUTER")
    ).length,
    status_counts: statusCounts,
  };
}

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
    if (!shouldUseApiFallback(err)) throw err;
    if (
      err &&
      typeof err === "object" &&
      "status" in err &&
      (err as { status?: number }).status === 401
    ) {
      throw err;
    }
    return getMockSummary();
  }
}
