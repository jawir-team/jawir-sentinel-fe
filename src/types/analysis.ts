export type AnalysisStatus = "GENERATING" | "COMPLETED" | "FAILED";
export type VerificationStatus = "PASS" | "PASS_WITH_WARNING" | "FAIL";
export type PolicyStatus =
  | "POLICY_FOUND"
  | "POLICY_NOT_FOUND"
  | "POLICY_PARTIAL"
  | "POLICY_CONFLICT";
export type EvidenceQuality = "HIGH" | "MEDIUM" | "LOW";
export type UncertaintyLevel = "LOW" | "MEDIUM" | "HIGH";

export interface FactItem {
  statement: string;
  source_type: string;
  source_ref?: string | null;
}

export interface UnknownItem {
  item: string;
  impact: string;
}

export interface RiskItem {
  type: string;
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  reason: string;
  evidence_refs: string[];
  policy_refs: string[];
}

export interface ComplianceAnalysis {
  status: "COMPLIANT" | "NON_COMPLIANT" | "REQUIRES_REVIEW";
  reason: string;
  policy_refs: string[];
}

export interface RecommendationAction {
  order: number;
  action: string;
  reason: string;
  policy_refs: string[];
  evidence_refs: string[];
}

export interface Recommendation {
  type: string;
  summary: string;
  actions: RecommendationAction[];
  potential_benefits: string[];
  potential_risks: string[];
}

export interface VerificationIssue {
  rule: string;
  message: string;
  severity?: "INFO" | "WARNING" | "ERROR";
}

export interface VerificationResult {
  status: VerificationStatus;
  issues?: VerificationIssue[];
}

export interface PolicyReference {
  policy_id: string;
  policy_code: string;
  policy_title: string;
  policy_version_id: string;
  version: string;
  section?: string | null;
  excerpt: string;
}

export interface EvidenceReference {
  evidence_id: string;
  usage_type: string;
}

export interface AnalysisSummaryItem {
  id: string;
  version: number;
  status: AnalysisStatus;
  verification_status?: VerificationStatus | null;
  created_at?: string;
}

export interface AnalysisDetail {
  id: string;
  version: number;
  status: AnalysisStatus;
  summary?: string | null;
  facts?: FactItem[] | null;
  assumptions?: string[] | null;
  unknowns?: UnknownItem[] | null;
  policy_status?: PolicyStatus | null;
  risk_analysis?: RiskItem[] | null;
  compliance_analysis?: ComplianceAnalysis | null;
  recommendation?: Recommendation | null;
  alternatives?: string[] | null;
  missing_information?: string[] | null;
  evidence_quality?: EvidenceQuality | null;
  uncertainty?: UncertaintyLevel | null;
  verification?: VerificationResult | null;
  policy_references?: PolicyReference[] | null;
  evidence_references?: EvidenceReference[] | null;
  failure_reason?: string | null;
  created_at: string;
}
