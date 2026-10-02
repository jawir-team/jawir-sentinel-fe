export type CaseStatus =
  | "DRAFT"
  | "AI_ANALYSIS"
  | "CHECKING"
  | "SIGNING"
  | "EXECUTION"
  | "DONE"
  | "CLOSED"
  | "ESCALATION_REQUIRED";

export type Urgency = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type CaseRole = "MAKER" | "CHECKER" | "SIGNER" | "EXECUTER";

export interface CaseTypeSummary {
  id: string;
  code: string;
  name: string;
}

export interface UserSummary {
  id: string;
  name: string;
}

export interface CaseParticipant {
  id: string;
  user_id: string;
  name: string;
  role: CaseRole;
  required: boolean;
  status: "ACTIVE" | "INACTIVE";
}

export interface CurrentAnalysisSummary {
  id: string;
  version: number;
  verification_status: "PASS" | "FAIL";
}

export interface CaseListItem {
  id: string;
  case_number: string;
  title: string;
  urgency: Urgency;
  status: CaseStatus;
  case_type: CaseTypeSummary;
  assigned_role?: CaseRole;
  created_at: string;
  updated_at: string;
}

export interface CaseDetail {
  id: string;
  case_number: string;
  title: string;
  description: string;
  urgency: Urgency;
  status: CaseStatus;
  case_type: CaseTypeSummary;
  maker: UserSummary;
  owner: UserSummary;
  participants: CaseParticipant[];
  current_analysis?: CurrentAnalysisSummary | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCasePayload {
  case_type_id: string;
  title: string;
  description: string;
  urgency: Urgency;
}

export interface UpdateCasePayload {
  title?: string;
  description?: string;
  urgency?: Urgency;
}

export interface AssignParticipantPayload {
  user_id: string;
  role: CaseRole;
}

export interface CasesFilterParams {
  status?: string;
  urgency?: string;
  case_type_id?: string;
  assigned_to_me?: boolean | string;
  page?: number;
  limit?: number;
}
