import { apiGet, apiPost } from "./client";
import {
  StartExecutionPayload,
  StartExecutionResponse,
  ExecutionResultPayload,
  ExecutionResultResponse,
  ExecutionItem,
} from "@/types/execution";

const mockExecutionsStore: Record<string, ExecutionItem[]> = {
  "case-001": [],
};

export async function getExecutions(caseId: string): Promise<ExecutionItem[]> {
  try {
    const res = await apiGet<ExecutionItem[] | { data: ExecutionItem[] }>(
      `/cases/${caseId}/executions`
    );
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
    return mockExecutionsStore[caseId] || [];
  }
}

export async function startExecution(
  caseId: string,
  payload: StartExecutionPayload
): Promise<StartExecutionResponse> {
  try {
    const res = await apiPost<
      StartExecutionResponse | { data: StartExecutionResponse },
      StartExecutionPayload
    >(`/cases/${caseId}/executions`, payload);
    if (res && "data" in res && !("started_at" in res)) {
      return (res as { data: StartExecutionResponse }).data;
    }
    return res as StartExecutionResponse;
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "status" in err &&
      (err as { status?: number }).status === 401
    ) {
      throw err;
    }

    const newExec: ExecutionItem = {
      id: `exec-${Date.now()}`,
      analysis_id: payload.analysis_id,
      status: "IN_PROGRESS",
      started_at: new Date().toISOString(),
      executed_by: { id: "usr-ops", name: "Operations User" },
    };

    if (!mockExecutionsStore[caseId]) {
      mockExecutionsStore[caseId] = [];
    }
    mockExecutionsStore[caseId].push(newExec);

    return {
      id: newExec.id,
      status: "IN_PROGRESS",
      started_at: newExec.started_at!,
    };
  }
}

export async function submitExecutionResult(
  caseId: string,
  executionId: string,
  payload: ExecutionResultPayload
): Promise<ExecutionResultResponse> {
  try {
    const res = await apiPost<
      ExecutionResultResponse | { data: ExecutionResultResponse },
      ExecutionResultPayload
    >(`/cases/${caseId}/executions/${executionId}/result`, payload);
    if (res && "data" in res && !("case_status" in res)) {
      return (res as { data: ExecutionResultResponse }).data;
    }
    return res as ExecutionResultResponse;
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "status" in err &&
      (err as { status?: number }).status === 401
    ) {
      throw err;
    }

    let nextCaseStatus = "DONE";
    if (payload.status === "BLOCKED" || payload.status === "FAILED") {
      nextCaseStatus = "AI_ANALYSIS";
    }

    // Update in-memory record
    const list = mockExecutionsStore[caseId] || [];
    const item = list.find((e) => e.id === executionId);
    if (item) {
      item.status = payload.status;
      item.action_taken = payload.action_taken;
      item.result = payload.result;
      item.blocker = payload.blocker;
      item.evidence_ids = payload.evidence_ids;
      item.completed_at = new Date().toISOString();
    }

    return {
      id: executionId,
      status: payload.status,
      case_status: nextCaseStatus,
    };
  }
}
