import { apiGet, apiPost, apiPatch } from "./client";
import {
  CaseDetail,
  CaseListItem,
  CasesFilterParams,
  CreateCasePayload,
  UpdateCasePayload,
  AssignParticipantPayload,
  CaseParticipant,
} from "@/types/case";
import { Pagination } from "@/types/api";
import { initialCases, initialCaseTypes } from "@/mocks/mockData";
import { ApiError } from "@/types/api";

let mockCases: CaseDetail[] = [...initialCases];

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
    if (err && typeof err === "object" && "status" in err && (err as { status?: number }).status === 401) {
      throw err;
    }

    let filtered = [...mockCases];
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
    if (err && typeof err === "object" && "status" in err && (err as { status?: number }).status === 401) {
      throw err;
    }
    const found = mockCases.find((c) => c.id === caseId || c.case_number === caseId);
    if (!found) {
      throw new ApiError("CASE_NOT_FOUND", "Case tidak ditemukan", 404);
    }
    return found as CaseDetail;
  }
}

export async function createCase(payload: CreateCasePayload): Promise<CaseDetail> {
  try {
    return await apiPost<CaseDetail, CreateCasePayload>("/cases", payload);
  } catch (err: unknown) {
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
      maker: { id: "usr-ops", name: "Operations User" },
      owner: { id: "usr-ops", name: "Operations User" },
      participants: [
        {
          id: `part-${Date.now()}`,
          user_id: "usr-ops",
          name: "Operations User",
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
    return newCase;
  }
}

export async function updateCase(
  caseId: string,
  payload: UpdateCasePayload
): Promise<CaseDetail> {
  try {
    return await apiPatch<CaseDetail, UpdateCasePayload>(`/cases/${caseId}`, payload);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "status" in err && (err as { status?: number }).status === 401) {
      throw err;
    }
    const index = mockCases.findIndex((c) => c.id === caseId);
    if (index === -1) {
      throw new ApiError("CASE_NOT_FOUND", "Case tidak ditemukan", 404);
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
    if (err && typeof err === "object" && "status" in err && (err as { status?: number }).status === 401) {
      throw err;
    }
    const found = mockCases.find((c) => c.id === caseId);
    if (!found) {
      throw new ApiError("CASE_NOT_FOUND", "Case tidak ditemukan", 404);
    }
    const newPart: CaseParticipant = {
      id: `part-${Date.now()}`,
      user_id: payload.user_id,
      name: payload.user_id === "usr-risk" ? "Risk User" : payload.user_id === "usr-manager" ? "Manager User" : "Assigned User",
      role: payload.role,
      required: true,
      status: "ACTIVE",
    };
    found.participants.push(newPart);
    return newPart;
  }
}

export async function submitCase(caseId: string): Promise<CaseDetail> {
  try {
    return await apiPost<CaseDetail>(`/cases/${caseId}/submit`);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "status" in err && (err as { status?: number }).status === 401) {
      throw err;
    }
    const index = mockCases.findIndex((c) => c.id === caseId || c.case_number === caseId);
    if (index === -1) {
      throw new ApiError("CASE_NOT_FOUND", "Case tidak ditemukan", 404);
    }
    mockCases[index].status = "AI_ANALYSIS";
    mockCases[index].updated_at = new Date().toISOString();
    return mockCases[index] as CaseDetail;
  }
}

export async function closeCase(
  caseId: string,
  payload: { reason: string }
): Promise<CaseDetail> {
  try {
    return await apiPost<CaseDetail>(`/cases/${caseId}/close`, payload);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "status" in err && (err as { status?: number }).status === 401) {
      throw err;
    }
    const index = mockCases.findIndex((c) => c.id === caseId || c.case_number === caseId);
    if (index === -1) {
      throw new ApiError("CASE_NOT_FOUND", "Case tidak ditemukan", 404);
    }
    const current = mockCases[index];
    if (current.status === "DONE" || current.status === "CLOSED") {
      throw new ApiError(
        "INVALID_STATE_TRANSITION",
        "Case yang sudah selesai atau ditutup tidak dapat ditutup kembali.",
        409
      );
    }
    mockCases[index] = {
      ...current,
      status: "CLOSED",
      updated_at: new Date().toISOString(),
    };
    return mockCases[index] as CaseDetail;
  }
}

