import { apiGet, apiPost, apiPatch, apiDelete, shouldUseApiFallback } from "./client";
import {
  CaseDetail,
  CaseListItem,
  CasesFilterParams,
  CreateCasePayload,
  CreateCaseResponse,
  SubmitCaseResponse,
  CloseCaseResponse,
  UpdateCasePayload,
  AssignParticipantPayload,
  CaseParticipant,
} from "@/types/case";
import { Pagination } from "@/types/api";
import { initialCases, initialCaseTypes, initialUsers } from "@/mocks/mockData";
import { ApiError } from "@/types/api";
import { appendMockHistory, initializeMockHistory } from "./history";
import { getActiveMockUser } from "@/mocks/mockSession";
import {
  hasMockActiveProcess,
  startMockAnalysisProcess,
} from "@/mocks/mockWorkflowState";

let mockCases: CaseDetail[] = [...initialCases];

export function getMockCase(caseId: string): CaseDetail | undefined {
  return mockCases.find((c) => c.id === caseId || c.case_number === caseId);
}

export function getMockCases(): CaseDetail[] {
  return mockCases;
}

export function updateMockCase(
  caseId: string,
  updates: Partial<CaseDetail>
): CaseDetail | undefined {
  const found = getMockCase(caseId);
  if (!found) return undefined;
  Object.assign(found, updates, { updated_at: new Date().toISOString() });
  return found;
}

export async function getCases(
  params?: CasesFilterParams
): Promise<{ data: CaseListItem[]; pagination: Pagination }> {
  try {
    const res = await apiGet<unknown>(
      "/cases",
      params as Record<string, string | number | boolean | undefined | null>
    );
    if (res && typeof res === "object" && "data" in res && "pagination" in res) {
      return res as { data: CaseListItem[]; pagination: Pagination };
    }
    if (Array.isArray(res)) {
      return {
        data: res as CaseListItem[],
        pagination: { page: 1, limit: res.length, total: res.length },
      };
    }
    return {
      data: [],
      pagination: { page: 1, limit: 20, total: 0 },
    };
  } catch (err: unknown) {
    if (!shouldUseApiFallback(err)) throw err;
    if (err && typeof err === "object" && "status" in err && (err as { status?: number }).status === 401) {
      throw err;
    }

    const actor = getActiveMockUser();
    let filtered = mockCases.filter(
      (caseItem) =>
        actor.system_role === "ADMIN" ||
        caseItem.participants.some(
          (participant) =>
            participant.user_id === actor.id && participant.status === "ACTIVE"
        )
    );
    if (params?.status) {
      filtered = filtered.filter((c) => c.status === params.status);
    }
    if (params?.urgency) {
      filtered = filtered.filter((c) => c.urgency === params.urgency);
    }
    if (params?.case_type_id) {
      filtered = filtered.filter((c) => c.case_type.id === params.case_type_id);
    }

    const page = params?.page || 1;
    const limit = params?.limit || 20;

    return {
      data: filtered.map((c) => ({
        id: c.id,
        case_number: c.case_number,
        title: c.title,
        urgency: c.urgency,
        status: c.status,
        case_type: c.case_type,
        created_at: c.created_at,
        updated_at: c.updated_at,
      })),
      pagination: {
        page,
        limit,
        total: filtered.length,
      },
    };
  }
}

export async function getCaseById(caseId: string): Promise<CaseDetail> {
  try {
    return await apiGet<CaseDetail>(`/cases/${caseId}`);
  } catch (err: unknown) {
    if (!shouldUseApiFallback(err)) throw err;
    if (err && typeof err === "object" && "status" in err && (err as { status?: number }).status === 401) {
      throw err;
    }
    const found = mockCases.find((c) => c.id === caseId || c.case_number === caseId);
    if (!found) {
      throw new ApiError("CASE_NOT_FOUND", "Case not found", 404);
    }
    const actor = getActiveMockUser();
    const canRead =
      actor.system_role === "ADMIN" ||
      found.participants.some(
        (participant) =>
          participant.user_id === actor.id && participant.status === "ACTIVE"
      );
    if (!canRead) {
      throw new ApiError("FORBIDDEN", "You are not authorized to read this case.", 403);
    }
    return {
      ...found,
      participants: [...found.participants],
      current_analysis: found.current_analysis
        ? { ...found.current_analysis }
        : found.current_analysis,
    };
  }
}

export async function createCase(payload: CreateCasePayload): Promise<CreateCaseResponse> {
  try {
    return await apiPost<CreateCaseResponse, CreateCasePayload>("/cases", payload);
  } catch (err: unknown) {
    if (!shouldUseApiFallback(err)) throw err;
    if (err && typeof err === "object" && "status" in err && (err as { status?: number }).status === 401) {
      throw err;
    }
    const ct =
      initialCaseTypes.find((t) => t.id === payload.case_type_id) || {
        id: payload.case_type_id,
        code: "SETTLEMENT_EXCEPTION",
        name: "Settlement Exception",
      };

    const newCaseNum = `CASE-2026-${String(mockCases.length + 1).padStart(6, "0")}`;
    const actor = getActiveMockUser();
    const newCase: CaseDetail = {
      id: `case-${Date.now()}`,
      case_number: newCaseNum,
      title: payload.title,
      description: payload.description,
      urgency: payload.urgency,
      status: "DRAFT",
      case_type: {
        id: ct.id,
        code: ct.code,
        name: ct.name,
      },
      maker: { id: actor.id, name: actor.name },
      owner: { id: actor.id, name: actor.name },
      participants: [
        {
          id: `part-${Date.now()}`,
          user_id: actor.id,
          name: actor.name,
          role: "MAKER",
          required: true,
          status: "ACTIVE",
        },
      ],
      current_analysis: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockCases.unshift(newCase);
    initializeMockHistory(newCase.id, {
      id: `hist-${Date.now()}`,
      event_type: "CASE_CREATED",
      actor: { id: actor.id, name: actor.name },
      actor_role: "MAKER",
      analysis_id: null,
      analysis_version: null,
      metadata: {},
      created_at: newCase.created_at,
    });
    return { id: newCase.id, case_number: newCase.case_number, status: "DRAFT" };
  }
}

export async function updateCase(
  caseId: string,
  payload: UpdateCasePayload
): Promise<CaseDetail> {
  try {
    return await apiPatch<CaseDetail, UpdateCasePayload>(`/cases/${caseId}`, payload);
  } catch (err: unknown) {
    if (!shouldUseApiFallback(err)) throw err;
    if (err && typeof err === "object" && "status" in err && (err as { status?: number }).status === 401) {
      throw err;
    }
    const index = mockCases.findIndex((c) => c.id === caseId);
    if (index === -1) {
      throw new ApiError("CASE_NOT_FOUND", "Case not found", 404);
    }
    if (mockCases[index].status !== "DRAFT") {
      throw new ApiError(
        "INVALID_STATE_TRANSITION",
        "Case core data can only be updated while in DRAFT.",
        409
      );
    }
    if (mockCases[index].maker.id !== getActiveMockUser().id) {
      throw new ApiError("FORBIDDEN", "Only the Maker can update this draft.", 403);
    }
    mockCases[index] = {
      ...mockCases[index],
      ...payload,
      updated_at: new Date().toISOString(),
    };
    return mockCases[index] as CaseDetail;
  }
}

export async function assignParticipant(
  caseId: string,
  payload: AssignParticipantPayload
): Promise<CaseParticipant> {
  try {
    return await apiPost<CaseParticipant, AssignParticipantPayload>(
      `/cases/${caseId}/participants`,
      payload
    );
  } catch (err: unknown) {
    if (!shouldUseApiFallback(err)) throw err;
    if (err && typeof err === "object" && "status" in err && (err as { status?: number }).status === 401) {
      throw err;
    }
    const found = mockCases.find((c) => c.id === caseId || c.case_number === caseId);
    if (!found) {
      throw new ApiError("CASE_NOT_FOUND", "Case not found", 404);
    }
    if (found.status !== "DRAFT") {
      throw new ApiError("INVALID_STATE_TRANSITION", "Participants can only be added while in DRAFT", 409);
    }
    if (found.maker.id !== getActiveMockUser().id) {
      throw new ApiError(
        "FORBIDDEN",
        "Only the Maker can assign draft participants.",
        403
      );
    }
    if (payload.role === "MAKER") {
      throw new ApiError(
        "INVALID_REQUEST",
        "Maker is assigned automatically and cannot be assigned through the participant API.",
        400
      );
    }

    const alreadyAssigned = found.participants.some(
      (p) =>
        (p.user_id === payload.user_id ||
          (p.role === "MAKER" && found.maker.id === payload.user_id)) &&
        p.status === "ACTIVE"
    );
    if (alreadyAssigned) {
      throw new ApiError(
        "SEGREGATION_OF_DUTIES_VIOLATION",
        "Segregation of Duties: A single user cannot hold more than one active role in the same case.",
        403
      );
    }

    if (
      payload.role === "SIGNER" &&
      found.participants.some((p) => p.role === "SIGNER" && p.status === "ACTIVE")
    ) {
      throw new ApiError(
        "INVALID_STATE_TRANSITION",
        "A case can only have exactly 1 active Signer.",
        409
      );
    }
    if (
      payload.role === "EXECUTER" &&
      found.participants.some((p) => p.role === "EXECUTER" && p.status === "ACTIVE")
    ) {
      throw new ApiError(
        "INVALID_STATE_TRANSITION",
        "A case can only have exactly 1 active Executer.",
        409
      );
    }

    const matchedUser = initialUsers.find((u) => u.id === payload.user_id);
    const newPart: CaseParticipant = {
      id: `part-${Date.now()}`,
      user_id: payload.user_id,
      name: matchedUser ? matchedUser.name : "Assigned User",
      role: payload.role,
      required: payload.role === "CHECKER" ? payload.required : true,
      status: "ACTIVE",
    };
    found.participants.push(newPart);
    const actor = getActiveMockUser();
    appendMockHistory(found.id, {
      event_type: "PARTICIPANT_ASSIGNED",
      actor: { id: actor.id, name: actor.name },
      actor_role: "MAKER",
      analysis_id: null,
      analysis_version: null,
      metadata: {
        participant_name: newPart.name,
        participant_role: newPart.role,
        required: newPart.required,
      },
    });
    return newPart;
  }
}

export async function removeParticipant(
  caseId: string,
  participantId: string
): Promise<{ id: string; status: "INACTIVE" }> {
  try {
    return await apiDelete<{ id: string; status: "INACTIVE" }>(
      `/cases/${caseId}/participants/${participantId}`
    );
  } catch (err: unknown) {
    if (!shouldUseApiFallback(err)) throw err;
    if (err && typeof err === "object" && "status" in err && (err as { status?: number }).status === 401) {
      throw err;
    }
    const found = mockCases.find((c) => c.id === caseId || c.case_number === caseId);
    if (!found) {
      throw new ApiError("CASE_NOT_FOUND", "Case not found", 404);
    }
    if (found.status !== "DRAFT") {
      throw new ApiError("INVALID_STATE_TRANSITION", "Participants can only be removed while in DRAFT", 409);
    }
    if (found.maker.id !== getActiveMockUser().id) {
      throw new ApiError(
        "FORBIDDEN",
        "Only the Maker can remove draft participants.",
        403
      );
    }
    const partIdx = found.participants.findIndex((p) => p.id === participantId);
    if (found.participants[partIdx]?.role === "MAKER") {
      throw new ApiError(
        "INVALID_STATE_TRANSITION",
        "Maker assignment is immutable.",
        409
      );
    }
    if (partIdx !== -1) {
      const removed = found.participants[partIdx];
      found.participants.splice(partIdx, 1);
      const actor = getActiveMockUser();
      appendMockHistory(found.id, {
        event_type: "PARTICIPANT_REMOVED",
        actor: { id: actor.id, name: actor.name },
        actor_role: "MAKER",
        analysis_id: null,
        analysis_version: null,
        metadata: {
          participant_name: removed.name,
          participant_role: removed.role,
        },
      });
    }
    return { id: participantId, status: "INACTIVE" };
  }
}

export async function submitCase(caseId: string): Promise<SubmitCaseResponse> {
  try {
    return await apiPost<SubmitCaseResponse>(`/cases/${caseId}/submit`, {});
  } catch (err: unknown) {
    if (!shouldUseApiFallback(err)) throw err;
    if (err && typeof err === "object" && "status" in err && (err as { status?: number }).status === 401) {
      throw err;
    }
    const index = mockCases.findIndex((c) => c.id === caseId || c.case_number === caseId);
    if (index === -1) {
      throw new ApiError("CASE_NOT_FOUND", "Case not found", 404);
    }
    const activeParticipants = mockCases[index].participants.filter(
      (participant) => participant.status === "ACTIVE"
    );
    const makerCount = activeParticipants.filter(
      (participant) => participant.role === "MAKER"
    ).length;
    const requiredCheckerCount = activeParticipants.filter(
      (participant) => participant.role === "CHECKER" && participant.required
    ).length;
    const signerCount = activeParticipants.filter(
      (participant) => participant.role === "SIGNER"
    ).length;
    const executerCount = activeParticipants.filter(
      (participant) => participant.role === "EXECUTER"
    ).length;
    const uniqueUsers = new Set(
      activeParticipants.map((participant) => participant.user_id)
    );
    if (
      mockCases[index].status !== "DRAFT" ||
      makerCount !== 1 ||
      requiredCheckerCount < 1 ||
      signerCount !== 1 ||
      executerCount !== 1 ||
      uniqueUsers.size !== activeParticipants.length
    ) {
      throw new ApiError(
        "INVALID_STATE_TRANSITION",
        "Case must be DRAFT with one Maker, at least one required Checker, one Signer, one Executer, and strict distinct users.",
        409
      );
    }
    if (mockCases[index].maker.id !== getActiveMockUser().id) {
      throw new ApiError("FORBIDDEN", "Only the Maker can submit this case.", 403);
    }
    const actor = getActiveMockUser();
    mockCases[index].status = "AI_ANALYSIS";
    mockCases[index].updated_at = new Date().toISOString();
    appendMockHistory(mockCases[index].id, {
      event_type: "CASE_SUBMITTED",
      actor: { id: actor.id, name: actor.name },
      actor_role: "MAKER",
      analysis_id: null,
      analysis_version: null,
      metadata: {},
    });
    startMockAnalysisProcess(mockCases[index].id);
    return { id: mockCases[index].id, status: "AI_ANALYSIS" };
  }
}

export async function closeCase(
  caseId: string,
  payload: { reason: string }
): Promise<CloseCaseResponse> {
  try {
    return await apiPost<CloseCaseResponse, { reason: string }>(
      `/cases/${caseId}/close`,
      payload
    );
  } catch (err: unknown) {
    if (!shouldUseApiFallback(err)) throw err;
    if (err && typeof err === "object" && "status" in err && (err as { status?: number }).status === 401) {
      throw err;
    }
    const index = mockCases.findIndex((c) => c.id === caseId || c.case_number === caseId);
    if (index === -1) {
      throw new ApiError("CASE_NOT_FOUND", "Case not found", 404);
    }
    const current = mockCases[index];
    if (current.status === "DONE" || current.status === "CLOSED") {
      throw new ApiError(
        "INVALID_STATE_TRANSITION",
        "Completed or closed cases cannot be closed again.",
        409
      );
    }
    const actor = getActiveMockUser();
    const participant = current.participants.find(
      (item) => item.user_id === actor.id && item.status === "ACTIVE"
    );
    if (!participant) {
      throw new ApiError(
        "FORBIDDEN",
        "Only an active case participant can close this case.",
        403
      );
    }
    if (current.status === "AI_ANALYSIS" || hasMockActiveProcess(current.id)) {
      throw new ApiError(
        "INVALID_STATE_TRANSITION",
        "Case cannot be closed while AI analysis is GENERATING or execution is IN_PROGRESS. Wait for the active process to reach a terminal state.",
        409
      );
    }
    if (!payload.reason.trim()) {
      throw new ApiError("INVALID_REQUEST", "Case closure reason is required.", 400);
    }
    const closedAt = new Date().toISOString();
    mockCases[index] = {
      ...current,
      status: "CLOSED",
      updated_at: closedAt,
    };
    appendMockHistory(current.id, {
      event_type: "CASE_CLOSED",
      actor: { id: actor.id, name: actor.name },
      actor_role: participant?.role ?? null,
      analysis_id: current.current_analysis?.id ?? null,
      analysis_version: current.current_analysis?.version ?? null,
      metadata: {
        reason: payload.reason.trim(),
        previous_status: current.status,
        closed_at: closedAt,
      },
    });
    return {
      id: mockCases[index].id,
      status: "CLOSED",
      close_reason: payload.reason,
      closed_at: closedAt,
    };
  }
}
