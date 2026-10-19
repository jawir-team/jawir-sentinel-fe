export const queryKeys = {
  me: () => ["me"] as const,
  dashboard: () => ["dashboard"] as const,
  cases: (filters?: Record<string, unknown>) => ["cases", filters] as const,
  case: (caseId: string) => ["case", caseId] as const,
  evidences: (caseId: string) => ["evidences", caseId] as const,
  analyses: (caseId: string) => ["analyses", caseId] as const,
  analysis: (caseId: string, analysisId: string) =>
    ["analysis", caseId, analysisId] as const,
  analysisCurrent: (caseId: string) => ["analysis-current", caseId] as const,
  checkerStatus: (caseId: string) => ["checker-status", caseId] as const,
  history: (caseId: string) => ["history", caseId] as const,
  policies: (filters?: Record<string, unknown>) =>
    ["policies", filters] as const,
  policy: (policyId: string) => ["policy", policyId] as const,
  users: (filters?: Record<string, unknown>) => ["users", filters] as const,
  units: () => ["units"] as const,
  caseTypes: () => ["case-types"] as const,
};
