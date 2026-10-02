import { apiGet, apiPost } from "./client";
import { EvidenceItem, CreateEvidencePayload } from "@/types/evidence";
import { ApiError } from "@/types/api";

const mockEvidences: Record<string, EvidenceItem[]> = {
  "case-001": [
    {
      id: "ev-001",
      evidence_type: "FILE",
      source_type: "MAKER",
      source_user: { id: "usr-ops", name: "Operations User" },
      title: "Reconciliation discrepancy log",
      content: "Detailed audit log of unmatched settlement records.",
      file_path: "evidence/case-001/settlement-discrepancy-log.pdf",
      mime_type: "application/pdf",
      created_at: "2026-10-01T10:02:00Z",
    },
    {
      id: "ev-002",
      evidence_type: "COMMENT",
      source_type: "MAKER",
      source_user: { id: "usr-ops", name: "Operations User" },
      title: "Upstream batch delay note",
      content: "Upstream clearing batch arrived 20 minutes late with 37 unmatched records requiring emergency hold.",
      file_path: null,
      mime_type: null,
      created_at: "2026-10-01T10:04:00Z",
    },
  ],
};

export async function getEvidences(caseId: string): Promise<EvidenceItem[]> {
  try {
    const res = await apiGet<EvidenceItem[] | { data: EvidenceItem[] }>(
      `/cases/${caseId}/evidences`
    );
    if (Array.isArray(res)) return res;
    if (res && "data" in res && Array.isArray(res.data)) return res.data;
    return [];
  } catch (err: unknown) {
    if (err && typeof err === "object" && "status" in err && (err as { status?: number }).status === 401) {
      throw err;
    }
    return mockEvidences[caseId] || [];
  }
}

export async function createEvidence(
  caseId: string,
  payload: CreateEvidencePayload
): Promise<EvidenceItem> {
  try {
    return await apiPost<EvidenceItem, CreateEvidencePayload>(
      `/cases/${caseId}/evidences`,
      payload
    );
  } catch (err: unknown) {
    if (err && typeof err === "object" && "status" in err && (err as { status?: number }).status === 401) {
      throw err;
    }

    const newEvidence: EvidenceItem = {
      id: `ev-${Date.now()}`,
      evidence_type: payload.evidence_type,
      source_type: "MAKER",
      source_user: { id: "usr-ops", name: "Operations User" },
      title: payload.title,
      content: payload.content,
      file_path: payload.file_path || null,
      mime_type: payload.mime_type || null,
      created_at: new Date().toISOString(),
    };

    if (!mockEvidences[caseId]) {
      mockEvidences[caseId] = [];
    }
    mockEvidences[caseId].push(newEvidence);
    return newEvidence;
  }
}

export async function getEvidenceUploadUrl(
  caseId: string,
  payload: { file_name: string; mime_type: string }
): Promise<{ upload_url: string; file_key: string }> {
  try {
    return await apiPost<{ upload_url: string; file_key: string }>(
      `/cases/${caseId}/evidences/upload-url`,
      payload
    );
  } catch (err: unknown) {
    if (err && typeof err === "object" && "status" in err && (err as { status?: number }).status === 401) {
      throw err;
    }
    const safeKey = `cases/${caseId}/evidence/${Date.now()}-${payload.file_name}`;
    return {
      upload_url: `https://mock-gcs.local/upload/${encodeURIComponent(safeKey)}`,
      file_key: safeKey,
    };
  }
}

export async function uploadFileToSignedUrl(
  uploadUrl: string,
  file: File
): Promise<void> {
  // If mock GCS url, simulate immediate upload
  if (uploadUrl.includes("mock-gcs.local")) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return;
  }

  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!res.ok) {
    throw new ApiError(
      "UPLOAD_FAILED",
      `Gagal mengunggah file ke Google Cloud Storage (${res.statusText})`,
      res.status
    );
  }
}

export async function registerFileEvidence(
  caseId: string,
  payload: { file_key: string; title: string; evidence_type?: string }
): Promise<EvidenceItem> {
  try {
    return await apiPost<EvidenceItem>(`/cases/${caseId}/evidences/file`, {
      evidence_type: payload.evidence_type || "DOCUMENT",
      title: payload.title,
      file_key: payload.file_key,
    });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "status" in err && (err as { status?: number }).status === 401) {
      throw err;
    }

    const ext = payload.file_key.split(".").pop()?.toLowerCase();
    const mime =
      ext === "pdf"
        ? "application/pdf"
        : ext === "png"
        ? "image/png"
        : "image/jpeg";

    const newEvidence: EvidenceItem = {
      id: `ev-${Date.now()}`,
      evidence_type: "FILE",
      source_type: "MAKER",
      source_user: { id: "usr-ops", name: "Operations User" },
      title: payload.title,
      content: `Berkas bukti terunggah: ${payload.file_key.split("/").pop()}`,
      file_path: payload.file_key,
      mime_type: mime,
      created_at: new Date().toISOString(),
    };

    if (!mockEvidences[caseId]) {
      mockEvidences[caseId] = [];
    }
    mockEvidences[caseId].push(newEvidence);
    return newEvidence;
  }
}

