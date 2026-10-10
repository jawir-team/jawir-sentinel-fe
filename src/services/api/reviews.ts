import { apiGet, apiPost, shouldUseApiFallback } from "./client";
import {
  CheckerDecisionPayload,
  CheckerDecisionResponse,
  CheckerStatusData,
  SignerDecisionPayload,
  SignerDecisionResponse,
} from "@/types/review";
import { getMockCase, updateMockCase } from "./cases";
import { appendMockHistory } from "./history";
import { getActiveMockUser } from "@/mocks/mockSession";
import { startMockAnalysisProcess } from "@/mocks/mockWorkflowState";
import { ApiError } from "@/types/api";

const mockCheckerStatusStore: Record<string, CheckerStatusData> = {
  "case-001": {
    analysis_id: "analysis-v1",
    required: 1,
    approved: 0,
    rejected: 0,
    pending: 1,
    checkers: [
      {
        user_id: "usr-risk",
        name: "Risk User",
        status: "PENDING",
        required: true,
      },
    ],
  },
  "case-002": {
    analysis_id: "analysis-v201",
    required: 1,
    approved: 1,
    rejected: 0,
    pending: 0,
    checkers: [
      {
        user_id: "usr-risk",
        name: "Risk User",
        status: "APPROVED",
        required: true,
      },
    ],
  },
};

function getMockActorId(): string | null {
  return getActiveMockUser().id;
}

function ensureMockCheckerStatus(caseId: string): CheckerStatusData {
  const caseData = getMockCase(caseId);
  const analysisId = caseData?.current_analysis?.id || "none";
  const existing = mockCheckerStatusStore[caseId];
  if (existing?.analysis_id === analysisId) return existing;

  const checkers = (caseData?.participants || [])
    .filter((participant) => participant.role === "CHECKER" && participant.status === "ACTIVE")
    .map((participant) => ({
      user_id: participant.user_id,
      name: participant.name,
      status: "PENDING" as const,
      required: participant.required,
    }));
  const status: CheckerStatusData = {
    analysis_id: analysisId,
    required: checkers.filter((checker) => checker.required).length,
    approved: 0,
    rejected: 0,
    pending: checkers.filter((checker) => checker.required).length,
    checkers,
  };
  mockCheckerStatusStore[caseId] = status;
  return status;
}

export async function getCheckerStatus(
  caseId: string
): Promise<CheckerStatusData> {
  try {
    const res = await apiGet<CheckerStatusData | { data: CheckerStatusData }>(
      `/cases/${caseId}/checker-status`
    );
    if (res && "data" in res && !("checkers" in res)) {
      return (res as { data: CheckerStatusData }).data;
    }
    return res as CheckerStatusData;
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
    const mocked = ensureMockCheckerStatus(caseId);
    return { ...mocked, checkers: mocked.checkers.map((checker) => ({ ...checker })) };
  }
}

export async function submitCheckerDecision(
  caseId: string,
  payload: CheckerDecisionPayload
): Promise<CheckerDecisionResponse> {
  try {
    const res = await apiPost<
      CheckerDecisionResponse | { data: CheckerDecisionResponse },
      CheckerDecisionPayload
    >(`/cases/${caseId}/checker-decisions`, payload);
    if (res && "data" in res && !("decision_id" in res)) {
      return (res as { data: CheckerDecisionResponse }).data;
    }
    return res as CheckerDecisionResponse;
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

    // In-memory mock response
    const caseData = getMockCase(caseId);
    if (!caseData || caseData.status !== "CHECKING") {
      throw new ApiError(
        "INVALID_STATE_TRANSITION",
        "Case must be in CHECKING state.",
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
    const statusData = ensureMockCheckerStatus(caseId);
    const actorId = getMockActorId();
    const actorRecord = statusData.checkers.find(
      (checker) => checker.user_id === actorId
    );
    if (!actorRecord) {
      throw new ApiError(
        "FORBIDDEN",
        "Only an assigned active Checker can submit this decision.",
        403
      );
    }
    let nextCaseStatus: CheckerDecisionResponse["case_status"] = "CHECKING";

    if (payload.decision === "REJECT") {
      nextCaseStatus = "AI_ANALYSIS";
      if (actorRecord?.status === "PENDING") {
        actorRecord.status = "REJECTED";
        statusData.rejected += 1;
        if (actorRecord.required) {
          statusData.pending = Math.max(0, statusData.pending - 1);
        }
      }
      updateMockCase(caseId, { status: "AI_ANALYSIS" });
    } else {
      if (actorRecord?.status === "PENDING") {
        actorRecord.status = "APPROVED";
        statusData.approved += 1;
        if (actorRecord.required) {
          statusData.pending = Math.max(0, statusData.pending - 1);
        }
      }
      if (statusData.approved >= statusData.required) {
        nextCaseStatus = "SIGNING";
        updateMockCase(caseId, { status: "SIGNING" });
      }
    }

    appendMockHistory(caseId, {
      event_type: payload.decision === "REJECT" ? "CHECKER_REJECTED" : "CHECKER_APPROVED",
      actor: actorRecord
        ? { id: actorRecord.user_id, name: actorRecord.name }
        : actorId
        ? { id: actorId, name: "Checker" }
        : null,
      actor_role: "CHECKER",
      analysis_id: payload.analysis_id,
      analysis_version: caseData?.current_analysis?.version ?? null,
      metadata: {
        ...(payload.reason ? { reason: payload.reason } : {}),
        ...(payload.comment ? { comment: payload.comment } : {}),
      },
    });
    if (payload.decision === "REJECT") {
      startMockAnalysisProcess(caseId);
    }

    return {
      decision_id: `dec-${Date.now()}`,
      decision: payload.decision,
      case_status: nextCaseStatus,
    };
  }
}

export async function submitSignerDecision(
  caseId: string,
  payload: SignerDecisionPayload
): Promise<SignerDecisionResponse> {
  try {
    const res = await apiPost<
      SignerDecisionResponse | { data: SignerDecisionResponse },
      SignerDecisionPayload
    >(`/cases/${caseId}/signer-decision`, payload);
    if (res && "data" in res && !("decision_id" in res)) {
      return (res as { data: SignerDecisionResponse }).data;
    }
    return res as SignerDecisionResponse;
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
    const signer = caseData?.participants.find(
      (participant) => participant.role === "SIGNER" && participant.status === "ACTIVE"
    );
    if (!caseData || caseData.status !== "SIGNING") {
      throw new ApiError(
        "INVALID_STATE_TRANSITION",
        "Case must be in SIGNING state.",
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
    if (signer?.user_id !== actor.id) {
      throw new ApiError(
        "FORBIDDEN",
        "Only the assigned active Signer can submit this decision.",
        403
      );
    }

    let nextCaseStatus: SignerDecisionResponse["case_status"] = "EXECUTION";
    if (payload.decision === "REJECT") {
      nextCaseStatus = "AI_ANALYSIS";
    }

    updateMockCase(caseId, { status: nextCaseStatus });
    appendMockHistory(caseId, {
      event_type: payload.decision === "REJECT" ? "SIGNER_REJECTED" : "SIGNER_APPROVED",
      actor: signer ? { id: signer.user_id, name: signer.name } : null,
      actor_role: "SIGNER",
      analysis_id: payload.analysis_id,
      analysis_version: caseData?.current_analysis?.version ?? null,
      metadata: {
        ...(payload.reason ? { reason: payload.reason } : {}),
        ...(payload.comment ? { comment: payload.comment } : {}),
      },
    });
    if (payload.decision === "REJECT") {
      startMockAnalysisProcess(caseId);
    }

    return {
      decision_id: `sig-dec-${Date.now()}`,
      decision: payload.decision,
      case_status: nextCaseStatus,
    };
  }
}
