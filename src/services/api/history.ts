import { apiGet } from "./client";
import { CaseHistoryEvent } from "@/types/history";

const mockHistories: Record<string, CaseHistoryEvent[]> = {
  "case-001": [
    {
      id: "hist-001",
      event_type: "CASE_CREATED",
      actor: { id: "usr-ops", name: "Operations User" },
      actor_role: "MAKER",
      analysis_id: null,
      analysis_version: null,
      metadata: {},
      created_at: "2026-10-01T10:00:00Z",
    },
    {
      id: "hist-002",
      event_type: "EVIDENCE_ADDED",
      actor: { id: "usr-ops", name: "Operations User" },
      actor_role: "MAKER",
      analysis_id: null,
      analysis_version: null,
      metadata: { title: "Reconciliation discrepancy log", evidence_type: "FILE" },
      created_at: "2026-10-01T10:02:00Z",
    },
    {
      id: "hist-003",
      event_type: "CASE_SUBMITTED",
      actor: { id: "usr-ops", name: "Operations User" },
      actor_role: "MAKER",
      analysis_id: null,
      analysis_version: null,
      metadata: {},
      created_at: "2026-10-01T10:03:00Z",
    },
    {
      id: "hist-004",
      event_type: "AI_ANALYSIS_STARTED",
      actor: null,
      actor_role: null,
      analysis_id: null,
      analysis_version: null,
      metadata: {},
      created_at: "2026-10-01T10:03:05Z",
    },
    {
      id: "hist-005",
      event_type: "AI_ANALYSIS_COMPLETED",
      actor: null,
      actor_role: null,
      analysis_id: "analysis-v1",
      analysis_version: 1,
      metadata: { verification_status: "PASS" },
      created_at: "2026-10-01T10:04:00Z",
    },
    {
      id: "hist-006",
      event_type: "CHECKER_APPROVED",
      actor: { id: "usr-risk", name: "Risk User" },
      actor_role: "CHECKER",
      analysis_id: "analysis-v1",
      analysis_version: 1,
      metadata: { comment: "Verified discrepancy matches clearing report." },
      created_at: "2026-10-01T10:05:00Z",
    },
  ],
};

export async function getCaseHistory(
  caseId: string
): Promise<CaseHistoryEvent[]> {
  try {
    const res = await apiGet<
      CaseHistoryEvent[] | { data: CaseHistoryEvent[] }
    >(`/cases/${caseId}/history`);
    if (Array.isArray(res)) return res;
    if (res && "data" in res && Array.isArray(res.data)) return res.data;
    return [];
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "status" in err &&
      (err as { status?: number }).status === 401
    ) {
      throw err;
    }
    return mockHistories[caseId] || [];
  }
}
