import { apiGet, shouldUseApiFallback } from "./client";
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
      metadata: { title: "Reconciliation discrepancy log", evidence_type: "DOCUMENT" },
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
  ],
  "case-006": [
    {
      id: "hist-601",
      event_type: "AI_ANALYSIS_COMPLETED",
      actor: null,
      actor_role: null,
      analysis_id: "analysis-v601",
      analysis_version: 1,
      metadata: { verification_status: "PASS" },
      created_at: "2026-10-01T08:15:00Z",
    },
    {
      id: "hist-602",
      event_type: "AI_ANALYSIS_FAILED",
      actor: null,
      actor_role: null,
      analysis_id: "analysis-v602",
      analysis_version: 2,
      metadata: { failure_type: "VERIFIER_FAIL" },
      created_at: "2026-10-01T09:00:00Z",
    },
  ],
  "case-003": [
    {
      id: "hist-301",
      event_type: "CASE_CREATED",
      actor: { id: "usr-ops", name: "Operations User" },
      actor_role: "MAKER",
      analysis_id: null,
      analysis_version: null,
      metadata: {},
      created_at: "2026-10-01T12:00:00Z",
    },
  ],
};

export function initializeMockHistory(
  caseId: string,
  event: CaseHistoryEvent
): void {
  mockHistories[caseId] = [event];
}

export function appendMockHistory(
  caseId: string,
  event: Omit<CaseHistoryEvent, "id" | "created_at"> & {
    id?: string;
    created_at?: string;
  }
): void {
  if (!mockHistories[caseId]) {
    mockHistories[caseId] = [];
  }
  mockHistories[caseId].push({
    ...event,
    id: event.id || `hist-${Date.now()}-${mockHistories[caseId].length + 1}`,
    created_at: event.created_at || new Date().toISOString(),
  });
}

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
    if (!shouldUseApiFallback(err)) throw err;
    if (
      err &&
      typeof err === "object" &&
      "status" in err &&
      (err as { status?: number }).status === 401
    ) {
      throw err;
    }
    return (mockHistories[caseId] || []).map((event) => ({ ...event }));
  }
}
