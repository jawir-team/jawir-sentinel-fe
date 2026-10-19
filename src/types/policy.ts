export type PolicyVersionStatus = "DRAFT" | "ACTIVE" | "SUPERSEDED";
export type IndexStatus = "NOT_STARTED" | "PROCESSING" | "READY" | "FAILED";

export interface PolicyVersion {
  id: string;
  policy_id: string;
  version: string;
  status: PolicyVersionStatus;
  index_status: IndexStatus;
  index_error?: string | null;
  index_attempt_id?: string | null;
  index_started_at?: string | null;
  index_recoverable?: boolean;
  indexed_at?: string | null;
  content: string;
  effective_from?: string | null;
  effective_until?: string | null;
  created_at: string;
  approved_at?: string | null;
}

export interface PolicyListItem {
  id: string;
  code: string;
  title: string;
  domain: string;
  case_type: {
    id: string;
    code: string;
    name: string;
  };
  active_version?: {
    id: string;
    version: string;
    status: PolicyVersionStatus;
    index_status: IndexStatus;
  } | null;
}

export interface PolicyDetail {
  id: string;
  code: string;
  title: string;
  domain: string;
  case_type: {
    id: string;
    code: string;
    name: string;
  };
  description: string;
  versions: PolicyVersion[];
  active_version?: PolicyVersion | null;
}

export interface CreatePolicyPayload {
  code: string;
  title: string;
  domain: string;
  case_type_id: string;
  description: string;
}

export interface CreatePolicyVersionPayload {
  version: string;
  content: string;
  effective_from?: string | null;
  effective_until?: string | null;
}

export interface PoliciesFilterParams {
  status?: string;
  case_type_id?: string;
  domain?: string;
  page?: number;
  limit?: number;
}
