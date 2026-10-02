import { apiGet, apiPost } from "./client";
import {
  CheckerDecisionPayload,
  CheckerDecisionResponse,
  CheckerStatusData,
  SignerDecisionPayload,
  SignerDecisionResponse,
} from "@/types/review";

const mockCheckerStatusStore: Record<string, CheckerStatusData> = {
  "case-001": {
    analysis_id: "analysis-v1",
    required: 2,
    approved: 1,
    rejected: 0,
    pending: 1,
    checkers: [
      {
        user_id: "usr-risk",
        name: "Risk User",
        status: "APPROVED",
        required: true,
      },
      {
        user_id: "usr-dev",
        name: "Development User",
        status: "PENDING",
        required: true,
      },
    ],
  },
};

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
    if (
      err &&
      typeof err === "object" &&
      "status" in err &&
      (err as { status?: number }).status === 401
    ) {
      throw err;
    }
    const mocked = mockCheckerStatusStore[caseId];
    if (mocked) {
      return mocked;
    }
    return {
      analysis_id: "none",
      required: 0,
      approved: 0,
      rejected: 0,
      pending: 0,
      checkers: [],
    };
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
    if (
      err &&
      typeof err === "object" &&
      "status" in err &&
      (err as { status?: number }).status === 401
    ) {
      throw err;
    }

    // In-memory mock response
    const statusData = mockCheckerStatusStore[caseId];
    let nextCaseStatus = "CHECKING";

    if (payload.decision === "REJECT") {
      nextCaseStatus = "AI_ANALYSIS";
      if (statusData) {
        statusData.rejected += 1;
        statusData.pending = Math.max(0, statusData.pending - 1);
      }
    } else {
      if (statusData) {
        statusData.approved += 1;
        statusData.pending = Math.max(0, statusData.pending - 1);
        if (statusData.approved >= statusData.required) {
          nextCaseStatus = "SIGNING";
        }
      }
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
    if (
      err &&
      typeof err === "object" &&
      "status" in err &&
      (err as { status?: number }).status === 401
    ) {
      throw err;
    }

    let nextCaseStatus = "EXECUTION";
    if (payload.decision === "REJECT") {
      nextCaseStatus = "AI_ANALYSIS";
    }

    return {
      decision_id: `sig-dec-${Date.now()}`,
      decision: payload.decision,
      case_status: nextCaseStatus,
    };
  }
}

