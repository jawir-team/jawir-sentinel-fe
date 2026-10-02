export type ExecutionStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "SUCCESS"
  | "BLOCKED"
  | "FAILED";

export interface StartExecutionPayload {
  analysis_id: string;
}

export interface StartExecutionResponse {
  id: string;
  status: "IN_PROGRESS";
  started_at: string;
}

export interface ExecutionResultPayload {
  status: "SUCCESS" | "BLOCKED" | "FAILED";
  action_taken: string;
  result?: string;
  blocker?: string;
  evidence_ids?: string[];
}

export interface ExecutionResultResponse {
  id: string;
  status: "SUCCESS" | "BLOCKED" | "FAILED";
  case_status: string;
}

export interface ExecutionItem {
  id: string;
  analysis_id: string;
  status: ExecutionStatus;
  started_at?: string;
  completed_at?: string;
  action_taken?: string | null;
  result?: string | null;
  blocker?: string | null;
  evidence_ids?: string[];
  executed_by?: {
    id: string;
    name: string;
  };
}
