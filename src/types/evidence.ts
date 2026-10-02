export type EvidenceType = "COMMENT" | "FILE" | "SYSTEM";
export type EvidenceSourceType =
  | "MAKER"
  | "CHECKER"
  | "SIGNER"
  | "EXECUTER"
  | "SYSTEM";

export interface EvidenceItem {
  id: string;
  evidence_type: EvidenceType;
  source_type: EvidenceSourceType;
  source_user?: {
    id: string;
    name: string;
  } | null;
  title: string;
  content: string;
  file_path?: string | null;
  mime_type?: string | null;
  created_at: string;
}

export interface CreateEvidencePayload {
  evidence_type: "COMMENT" | "FILE";
  title: string;
  content: string;
  file_path?: string;
  mime_type?: string;
}
