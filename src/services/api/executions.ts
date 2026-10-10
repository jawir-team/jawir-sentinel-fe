import { apiGet, apiPost, shouldUseApiFallback } from "./client";
import {
  StartExecutionPayload,
  StartExecutionResponse,
  ExecutionResultPayload,
  ExecutionResultResponse,
  ExecutionItem,
} from "@/types/execution";
import { getMockCase, updateMockCase } from "./cases";
import { appendMockHistory } from "./history";
import { getActiveMockUser } from "@/mocks/mockSession";
import { startMockAnalysisProcess, setMockExecutionActive } from "@/mocks/mockWorkflowState";
import { ApiError } from "@/types/api";

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
    if (!shouldUseApiFallback(err)) throw err;
    if (
      err &&
      typeof err === "object" &&
      "status" in err &&
      (err as { status?: number }).status === 401
    ) {
      throw err;
    }
    return (mockExecutionsStore[caseId] || []).map((execution) => ({ ...execution }));
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
    if (!shouldUseApiFallback(err)) throw err;
    if (
      err &&
      typeof err === "object" &&
      "status" in err &&
      (err as { status?: number }).status === 401
    ) {
      throw err;
    }

    const actor = getActiveMockUser();
    const caseData = getMockCase(caseId);
    const executer = caseData?.participants.find(
      (participant) => participant.role === "EXECUTER" && participant.status === "ACTIVE"
    );
    if (!caseData || caseData.status !== "EXECUTION") {
      throw new ApiError(
        "INVALID_STATE_TRANSITION",
        "Case must be in EXECUTION state.",
        409
      );
    }
    if (payload.analysis_id !== caseData.current_analysis?.id) {
      throw new ApiError(
        "STALE_ANALYSIS",
        "Analysis version is no longer current.",
        409
      );
    }
    if (executer?.user_id !== actor.id) {
      throw new ApiError(
        "FORBIDDEN",
        "Only the assigned active Executer can start execution.",
        403
      );
    }
    if ((mockExecutionsStore[caseId] || []).some((item) => item.status === "IN_PROGRESS")) {
      throw new ApiError(
        "INVALID_STATE_TRANSITION",
        "An execution is already IN_PROGRESS.",
        409
      );
    }
    const newExec: ExecutionItem = {
      id: `exec-${Date.now()}`,
      analysis_id: payload.analysis_id,
      status: "IN_PROGRESS",
      started_at: new Date().toISOString(),
      executed_by: { id: actor.id, name: actor.name },
    };

    if (!mockExecutionsStore[caseId]) {
      mockExecutionsStore[caseId] = [];
    }
    mockExecutionsStore[caseId].push(newExec);
    setMockExecutionActive(caseId, true);
    appendMockHistory(caseId, {
      event_type: "EXECUTION_STARTED",
      actor: newExec.executed_by,
      actor_role: "EXECUTER",
      analysis_id: payload.analysis_id,
      analysis_version: caseData?.current_analysis?.version ?? null,
      metadata: {},
    });

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
    if (!shouldUseApiFallback(err)) throw err;
    if (
      err &&
      typeof err === "object" &&
      "status" in err &&
      (err as { status?: number }).status === 401
    ) {
      throw err;
    }

    const caseData = getMockCase(caseId);
    const actor = getActiveMockUser();
    const executer = caseData?.participants.find(
      (participant) => participant.role === "EXECUTER" && participant.status === "ACTIVE"
    );
    const list = mockExecutionsStore[caseId] || [];
    const item = list.find((execution) => execution.id === executionId);
    if (!caseData || caseData.status !== "EXECUTION" || item?.status !== "IN_PROGRESS") {
      throw new ApiError(
        "INVALID_STATE_TRANSITION",
        "Execution result requires an IN_PROGRESS execution in EXECUTION state.",
        409
      );
    }
    if (executer?.user_id !== actor.id) {
      throw new ApiError(
        "FORBIDDEN",
        "Only the assigned active Executer can submit the execution result.",
        403
      );
    }

    let nextCaseStatus: ExecutionResultResponse["case_status"] = "DONE";
    if (payload.status === "BLOCKED" || payload.status === "FAILED") {
      nextCaseStatus = "AI_ANALYSIS";
    }
    setMockExecutionActive(caseId, false);

    // Update in-memory record
    if (item) {
      item.status = payload.status;
      item.action_taken = payload.action_taken;
      item.result = payload.result;
      item.blocker = payload.blocker;
      item.evidence_ids = payload.evidence_ids;
      item.completed_at = new Date().toISOString();
    }

    updateMockCase(caseId, { status: nextCaseStatus });
    appendMockHistory(caseId, {
      event_type:
        payload.status === "SUCCESS"
          ? "EXECUTION_SUCCESS"
          : payload.status === "BLOCKED"
          ? "EXECUTION_BLOCKED"
          : "EXECUTION_FAILED",
      actor: item?.executed_by || { id: "usr-dev", name: "Development User" },
      actor_role: "EXECUTER",
      analysis_id: item?.analysis_id || caseData?.current_analysis?.id || null,
      analysis_version: caseData?.current_analysis?.version ?? null,
      metadata: {
        action_taken: payload.action_taken,
        ...(payload.result ? { result: payload.result } : {}),
        ...(payload.blocker ? { blocker: payload.blocker } : {}),
      },
    });
    if (payload.status === "BLOCKED" || payload.status === "FAILED") {
      startMockAnalysisProcess(caseId);
    }

    return {
      id: executionId,
      status: payload.status,
      case_status: nextCaseStatus,
    };
  }
}
