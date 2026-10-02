export type ReviewDecision = "APPROVE" | "REJECT";

export interface CheckerDecisionPayload {
  analysis_id: string;
  decision: ReviewDecision;
  reason?: string;
  comment?: string;
  evidence_ids?: string[];
}

export interface CheckerDecisionResponse {
  decision_id: string;
  decision: ReviewDecision;
  case_status: string;
}

export interface CheckerItemStatus {
  user_id: string;
  name: string;
  status: "APPROVED" | "REJECTED" | "PENDING";
  required?: boolean;
}

export interface CheckerStatusData {
  analysis_id: string;
  required: number;
  approved: number;
  rejected: number;
  pending: number;
  checkers: CheckerItemStatus[];
}

export interface SignerDecisionPayload {
  analysis_id: string;
  decision: ReviewDecision;
  reason?: string;
  comment?: string;
}

export interface SignerDecisionResponse {
  decision_id: string;
  decision: ReviewDecision;
  case_status: string;
}

