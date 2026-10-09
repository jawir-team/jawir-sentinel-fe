export type EvidenceType =
  | "COMMENT"
  | "DOCUMENT"
  | "LOG"
  | "SCREENSHOT"
  | "REFERENCE"
  | "EXECUTION_RESULT";
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
  evidence_type: "COMMENT" | "DOCUMENT" | "LOG" | "SCREENSHOT" | "REFERENCE";
  title: string;
  content: string;
}
