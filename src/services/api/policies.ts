import { apiGet, apiPost } from "./client";
import {
  PolicyDetail,
  PolicyListItem,
  PolicyVersion,
  PoliciesFilterParams,
  CreatePolicyPayload,
  CreatePolicyVersionPayload,
} from "@/types/policy";
import { Pagination, ApiError } from "@/types/api";

const initialPolicies: PolicyDetail[] = [
  {
    id: "pol-001",
    code: "SOP-OPS-001",
    title: "Settlement Exception Handling",
    domain: "SETTLEMENT",
    case_type: {
      id: "ct-settlement",
      code: "SETTLEMENT_EXCEPTION",
      name: "Settlement Exception",
    },
    description: "Operational procedure and rules for handling settlement exceptions and mismatches.",
    versions: [
      {
        id: "ver-001",
        policy_id: "pol-001",
        version: "1.0",
        status: "ACTIVE",
        index_status: "READY",
        content: "Prosedur Penanganan Selisih Rekonsiliasi:\n1. Transaksi dengan selisih wajib diverifikasi dalam 90 menit.\n2. Jika bukti otorisasi belum lengkap, transaksi terdampak wajib di-hold.\n3. Checker dari Unit Risiko dan Unit TI wajib menyetujui sebelum eksekusi.",
        effective_from: "2026-01-01T00:00:00Z",
        effective_until: null,
        created_at: "2026-01-01T00:00:00Z",
        approved_at: "2026-01-01T00:00:00Z",
        indexed_at: "2026-01-01T00:05:00Z",
        index_recoverable: false,
      },
      {
        id: "ver-002",
        policy_id: "pol-001",
        version: "2.0-DRAFT",
        status: "DRAFT",
        index_status: "NOT_STARTED",
        content: "Pembaruan SOP 2.0: Batas waktu verifikasi diperpanjang menjadi 120 menit dengan SLA eskalasi otomatis.",
        effective_from: "2026-01-01T00:00:00Z",
        effective_until: null,
        created_at: "2026-10-01T08:00:00Z",
        index_recoverable: false,
      },
    ],
  },
  {
    id: "pol-002",
    code: "SOP-CRD-002",
    title: "Intraday Credit Override Standard",
    domain: "CREDIT",
    case_type: {
      id: "ct-credit",
      code: "CREDIT_OVERRIDE",
      name: "Credit Limit Override",
    },
    description: "Governing policy for intraday credit limits and liquidity buffer expansions.",
    versions: [
      {
        id: "ver-101",
        policy_id: "pol-002",
        version: "1.0",
        status: "ACTIVE",
        index_status: "READY",
        content: "Kebijakan Pelampauan Batas Kredit Intraday:\n1. Membutuhkan persetujuan Signer setingkat Manager.\n2. Nilai pelampauan maksimal 20% dari buffer likuiditas harian.",
        effective_from: "2026-01-01T00:00:00Z",
        effective_until: null,
        created_at: "2026-01-01T00:00:00Z",
        approved_at: "2026-01-01T00:00:00Z",
        indexed_at: "2026-01-01T00:05:00Z",
        index_recoverable: false,
      },
    ],
  },
];

let mockPolicies: PolicyDetail[] = [...initialPolicies];

export async function getPolicies(
  params?: PoliciesFilterParams
): Promise<{ data: PolicyListItem[]; pagination: Pagination }> {
  try {
    const res = await apiGet<unknown>(
      "/policies",
      params as Record<string, string | number | boolean | undefined | null>
    );
    if (res && typeof res === "object" && "data" in res && "pagination" in res) {
      return res as { data: PolicyListItem[]; pagination: Pagination };
    }
    if (Array.isArray(res)) {
      return {
        data: res as PolicyListItem[],
        pagination: { page: 1, limit: res.length, total: res.length },
      };
    }
    return { data: [], pagination: { page: 1, limit: 20, total: 0 } };
  } catch (err: unknown) {
    if (err && typeof err === "object" && "status" in err && (err as { status?: number }).status === 401) {
      throw err;
    }

    let filtered = [...mockPolicies];
    if (params?.domain) {
      filtered = filtered.filter((p) => p.domain === params.domain);
    }
    if (params?.case_type_id) {
      filtered = filtered.filter((p) => p.case_type.id === params.case_type_id);
    }

    const items: PolicyListItem[] = filtered.map((p) => {
      const activeVer = p.versions.find((v) => v.status === "ACTIVE");
      return {
        id: p.id,
        code: p.code,
        title: p.title,
        domain: p.domain,
        case_type: p.case_type,
        active_version: activeVer
          ? {
              id: activeVer.id,
              version: activeVer.version,
              status: activeVer.status,
              index_status: activeVer.index_status,
            }
          : null,
      };
    });

    return {
      data: items,
      pagination: {
        page: params?.page || 1,
        limit: params?.limit || 20,
        total: items.length,
      },
    };
  }
}

export async function getPolicyById(policyId: string): Promise<PolicyDetail> {
  try {
    return await apiGet<PolicyDetail>(`/policies/${policyId}`);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "status" in err && (err as { status?: number }).status === 401) {
      throw err;
    }
    const found = mockPolicies.find((p) => p.id === policyId || p.code === policyId);
    if (!found) {
      throw new ApiError("POLICY_NOT_FOUND", "Kebijakan tidak ditemukan", 404);
    }
    const active = found.versions.find((v) => v.status === "ACTIVE") || null;
    return { ...found, active_version: active };
  }
}

export async function createPolicy(
  payload: CreatePolicyPayload
): Promise<PolicyDetail> {
  try {
    return await apiPost<PolicyDetail, CreatePolicyPayload>("/policies", payload);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "status" in err && (err as { status?: number }).status === 401) {
      throw err;
    }
    const newPolicy: PolicyDetail = {
      id: `pol-${Date.now()}`,
      code: payload.code.toUpperCase(),
      title: payload.title,
      domain: payload.domain.toUpperCase(),
      case_type: {
        id: payload.case_type_id,
        code: "SETTLEMENT_EXCEPTION",
        name: "Settlement Exception",
      },
      description: payload.description,
      versions: [],
    };
    mockPolicies.push(newPolicy);
    return newPolicy;
  }
}

export async function createPolicyVersion(
  policyId: string,
  payload: CreatePolicyVersionPayload
): Promise<PolicyVersion> {
  try {
    return await apiPost<PolicyVersion, CreatePolicyVersionPayload>(
      `/policies/${policyId}/versions`,
      payload
    );
  } catch (err: unknown) {
    if (err && typeof err === "object" && "status" in err && (err as { status?: number }).status === 401) {
      throw err;
    }
    const policy = mockPolicies.find((p) => p.id === policyId);
    if (!policy) {
      throw new ApiError("POLICY_NOT_FOUND", "Policy tidak ditemukan", 404);
    }

    if (payload.effective_from && payload.effective_until) {
      if (new Date(payload.effective_until) <= new Date(payload.effective_from)) {
        throw new ApiError(
          "INVALID_REQUEST",
          "effective_until harus setelah effective_from",
          400
        );
      }
    }

    const newVer: PolicyVersion = {
      id: `ver-${Date.now()}`,
      policy_id: policyId,
      version: payload.version,
      status: "DRAFT",
      index_status: "NOT_STARTED",
      content: payload.content,
      effective_from: payload.effective_from || new Date().toISOString(),
      effective_until: payload.effective_until || null,
      created_at: new Date().toISOString(),
      index_recoverable: false,
    };

    policy.versions.push(newVer);
    return newVer;
  }
}

export async function activatePolicyVersion(
  policyId: string,
  versionId: string
): Promise<PolicyVersion> {
  try {
    return await apiPost<PolicyVersion>(
      `/policies/${policyId}/versions/${versionId}/activate`
    );
  } catch (err: unknown) {
    if (err && typeof err === "object" && "status" in err && (err as { status?: number }).status === 401) {
      throw err;
    }
    const policy = mockPolicies.find((p) => p.id === policyId);
    if (!policy) {
      throw new ApiError("POLICY_NOT_FOUND", "Policy tidak ditemukan", 404);
    }
    const target = policy.versions.find((v) => v.id === versionId);
    if (!target) {
      throw new ApiError("VERSION_NOT_FOUND", "Versi policy tidak ditemukan", 404);
    }

    // Effective time guard
    const now = new Date();
    if (target.effective_from && new Date(target.effective_from) > now) {
      throw new ApiError(
        "INVALID_STATE_TRANSITION",
        "Versi policy belum mencapai tanggal efektif (future-effective).",
        409
      );
    }
    if (target.effective_until && new Date(target.effective_until) <= now) {
      throw new ApiError(
        "INVALID_STATE_TRANSITION",
        "Versi policy sudah kadaluarsa (expired).",
        409
      );
    }

    // Mark old ACTIVE as SUPERSEDED
    policy.versions.forEach((v) => {
      if (v.status === "ACTIVE") {
        v.status = "SUPERSEDED";
      }
    });

    target.status = "ACTIVE";
    target.index_status = "READY";
    target.indexed_at = new Date().toISOString();
    target.approved_at = new Date().toISOString();

    return target;
  }
}

export async function recoverPolicyIndexing(
  policyId: string,
  versionId: string
): Promise<PolicyVersion> {
  try {
    return await apiPost<PolicyVersion>(
      `/policies/${policyId}/versions/${versionId}/recover`
    );
  } catch (err: unknown) {
    if (err && typeof err === "object" && "status" in err && (err as { status?: number }).status === 401) {
      throw err;
    }
    const policy = mockPolicies.find((p) => p.id === policyId);
    if (!policy) {
      throw new ApiError("POLICY_NOT_FOUND", "Policy tidak ditemukan", 404);
    }
    const target = policy.versions.find((v) => v.id === versionId);
    if (!target) {
      throw new ApiError("VERSION_NOT_FOUND", "Versi policy tidak ditemukan", 404);
    }

    target.index_status = "READY";
    target.indexed_at = new Date().toISOString();
    target.index_recoverable = false;
    return target;
  }
}
