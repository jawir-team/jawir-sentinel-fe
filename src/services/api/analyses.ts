import { apiGet, shouldUseApiFallback } from "./client";
import {
  AnalysisDetail,
  AnalysisSummaryItem,
} from "@/types/analysis";
import { getMockCase, updateMockCase } from "./cases";
import { appendMockHistory } from "./history";
import {
  registerMockAnalysisStarter,
  setMockAnalysisActive,
} from "@/mocks/mockWorkflowState";

const mockAnalysisDetails: Record<string, AnalysisDetail> = {
  "analysis-v1": {
    id: "analysis-v1",
    version: 1,
    status: "COMPLETED",
    summary:
      "Settlement exception requires controlled holding of 37 unmatched transactions pending counterparty verification.",
    facts: [
      {
        statement:
          "37 transactions are unmatched between ledger and clearing house.",
        source_type: "CASE",
        source_ref: null,
      },
      {
        statement:
          "Daily settlement batch cutoff threshold expires in 90 minutes.",
        source_type: "EVIDENCE",
        source_ref: "ev-001",
      },
    ],
    assumptions: [
      "Downstream counterparty network is operating within standard SLA.",
    ],
    unknowns: [
      {
        item: "Availability of missing counterparty confirmation slip",
        impact:
          "Determines whether transactions can be cleared or must be refunded",
      },
    ],
    policy_status: "POLICY_FOUND",
    risk_analysis: [
      {
        type: "OPERATIONAL",
        level: "HIGH",
        reason:
          "Approaching settlement cutoff window poses liquidity freeze risk.",
        evidence_refs: ["ev-001"],
        policy_refs: ["pol-001"],
      },
    ],
    compliance_analysis: {
      status: "REQUIRES_REVIEW",
      reason:
        "Transaction mismatch exceeds standard auto-settlement tolerance of IDR 0.",
      policy_refs: ["pol-001"],
    },
    recommendation: {
      type: "POLICY_BASED",
      summary:
        "Hold 37 affected transactions until exception reconciliation is verified.",
      actions: [
        {
          order: 1,
          action: "Isolate unmatched records from batch settlement pool.",
          reason:
            "Avoid propagating out-of-balance entries into the clearing gateway.",
          policy_refs: ["pol-001"],
          evidence_refs: ["ev-001"],
        },
        {
          order: 2,
          action:
            "Notify clearing counterparty operations desk for ledger trace.",
          reason:
            "Verify whether transactions were processed on receiver side.",
          policy_refs: ["pol-001"],
          evidence_refs: [],
        },
      ],
      potential_benefits: ["Prevents duplicate settlement payout risk."],
      potential_risks: [
        "Counterparty settlement SLA delayed up to next window.",
      ],
    },
    alternatives: [
      "Force clear with temporary suspense ledger buffer (High Risk)",
    ],
    missing_information: [
      "Counterparty MT940 end-of-day clearing report",
    ],
    evidence_quality: "HIGH",
    uncertainty: "LOW",
    verification: {
      status: "PASS",
      issues: [],
    },
    policy_references: [
      {
        policy_id: "pol-001",
        policy_code: "SOP-OPS-001",
        policy_title: "Settlement Exception Handling Policy",
        policy_version_id: "pol-v-001",
        version: "1.0",
        section: "Section 4.2: Unmatched Transaction Hold Procedures",
        excerpt:
          "When transaction reconciliation discrepancy is detected prior to cutoff, all unverified transactions exceeding zero tolerance must be isolated immediately.",
      },
    ],
    evidence_references: [
      {
        evidence_id: "ev-001",
        usage_type: "SUPPORTING_FACT",
      },
      {
        evidence_id: "ev-003",
        usage_type: "VISUAL_CORROBORATION",
      },
    ],
    created_at: "2026-10-01T10:02:00Z",
  },
  "analysis-v2": {
    id: "analysis-v2",
    version: 2,
    status: "FAILED",
    summary: null,
    facts: null,
    assumptions: null,
    unknowns: null,
    policy_status: null,
    risk_analysis: null,
    compliance_analysis: null,
    recommendation: null,
    alternatives: null,
    missing_information: null,
    evidence_quality: null,
    uncertainty: null,
    verification: {
      status: "FAIL",
      issues: [
        {
          rule: "HALLUCINATED_POLICY_REFERENCE",
          message:
            "AI generated references to non-existent policy SOP-OPS-999.",
          severity: "ERROR",
        },
      ],
    },
    policy_references: null,
    evidence_references: null,
    created_at: "2026-10-01T10:04:00Z",
  },
  "analysis-v201": {
    id: "analysis-v201",
    version: 1,
    status: "COMPLETED",
    summary:
      "Intraday credit line override request requires executive signer authorization with risk mitigation monitoring.",
    facts: [
      {
        statement:
          "Intraday credit exposure exceeds single-counterparty limit by 15%.",
        source_type: "CASE",
        source_ref: null,
      },
    ],
    assumptions: ["Counterparty collateral valuation remains above 120% haircut threshold."],
    unknowns: [],
    policy_status: "POLICY_CONFLICT",
    risk_analysis: [
      {
        type: "CREDIT",
        level: "CRITICAL",
        reason: "Exposure breach during volatile market hours.",
        evidence_refs: [],
        policy_refs: ["pol-002", "pol-001"],
      },
    ],
    compliance_analysis: {
      status: "REQUIRES_REVIEW",
      reason: "Override requires Signer level approval under credit governance rules.",
      policy_refs: ["pol-002", "pol-001"],
    },
    recommendation: {
      type: "POLICY_BASED",
      summary: "Approve temporary 4-hour override contingent on additional collateral pledge.",
      actions: [
        {
          order: 1,
          action: "Execute temporary credit limit override in core banking.",
          reason: "Prevent systemic settlement deadlock.",
          policy_refs: ["pol-002", "pol-001"],
          evidence_refs: [],
        },
      ],
      potential_benefits: ["Maintains payment flow integrity."],
      potential_risks: ["Counterparty default exposure increases."],
    },
    alternatives: ["Reject override request and fail pending payment queue."],
    missing_information: [],
    evidence_quality: "HIGH",
    uncertainty: "MEDIUM",
    verification: {
      status: "PASS_WITH_WARNING",
      issues: [
        {
          rule: "CONFLICTING_POLICY_GUIDANCE",
          message:
            "Credit override authorization and settlement hold guidance conflict; Signer judgment is required.",
          severity: "WARNING",
        },
      ],
    },
    policy_references: [
      {
        policy_id: "pol-002",
        policy_code: "SOP-CRD-002",
        policy_title: "Intraday Credit Override Standard",
        policy_version_id: "ver-101",
        version: "1.0",
        section: "Section 6.1: Credit Overrides",
        excerpt:
          "Intraday credit overrides exceeding standard parameters must be authorized by an executive Signer.",
      },
      {
        policy_id: "pol-001",
        policy_code: "SOP-OPS-001",
        policy_title: "Settlement Exception Handling",
        policy_version_id: "ver-001",
        version: "1.0",
        section: "Section 4.2: Settlement Holds",
        excerpt:
          "Transactions with incomplete authorization evidence must remain on hold.",
      },
    ],
    evidence_references: [],
    created_at: "2026-10-01T11:05:00Z",
  },
};

const mockCaseAnalyses: Record<string, AnalysisSummaryItem[]> = {
  "case-001": [
    {
      id: "analysis-v1",
      version: 1,
      status: "COMPLETED",
      verification_status: "PASS",
      created_at: "2026-10-01T10:02:00Z",
    },
  ],
  "case-002": [
    {
      id: "analysis-v201",
      version: 1,
      status: "COMPLETED",
      verification_status: "PASS_WITH_WARNING",
      created_at: "2026-10-01T11:05:00Z",
    },
  ],
  "case-004": [
    {
      id: "analysis-v401",
      version: 1,
      status: "COMPLETED",
      verification_status: "PASS",
      created_at: "2026-10-01T13:15:00Z",
    },
  ],
  "case-006": [
    {
      id: "analysis-v601",
      version: 1,
      status: "COMPLETED",
      verification_status: "PASS",
      created_at: "2026-10-01T08:15:00Z",
    },
    {
      id: "analysis-v602",
      version: 2,
      status: "FAILED",
      verification_status: "FAIL",
      created_at: "2026-10-01T09:00:00Z",
    },
  ],
};

mockAnalysisDetails["analysis-v601"] = {
  ...mockAnalysisDetails["analysis-v1"],
  id: "analysis-v601",
  created_at: "2026-10-01T08:15:00Z",
};
mockAnalysisDetails["analysis-v401"] = {
  ...mockAnalysisDetails["analysis-v1"],
  id: "analysis-v401",
  created_at: "2026-10-01T13:15:00Z",
};
mockAnalysisDetails["analysis-v602"] = {
  ...mockAnalysisDetails["analysis-v2"],
  id: "analysis-v602",
  created_at: "2026-10-01T09:00:00Z",
};

const mockCurrentAnalysisMap: Record<string, string> = {
  "case-001": "analysis-v1",
  "case-002": "analysis-v201",
  "case-004": "analysis-v401",
  "case-006": "analysis-v601",
};

const mockAnalysisReadyAt: Record<string, number> = {};

function startMockAnalysisIfNeeded(caseId: string): void {
  const caseData = getMockCase(caseId);
  if (!caseData || caseData.status !== "AI_ANALYSIS") return;

  const attempts = mockCaseAnalyses[caseId] || [];
  if (attempts.some((item) => item.status === "GENERATING")) return;

  const version = attempts.reduce((max, item) => Math.max(max, item.version), 0) + 1;
  const analysisId = `analysis-${caseId}-v${version}`;
  const createdAt = new Date().toISOString();

  const summary: AnalysisSummaryItem = {
    id: analysisId,
    version,
    status: "GENERATING",
    verification_status: null,
    created_at: createdAt,
  };
  const detail: AnalysisDetail = {
    id: analysisId,
    version,
    status: "GENERATING",
    summary: null,
    facts: null,
    assumptions: null,
    unknowns: null,
    policy_status: null,
    risk_analysis: null,
    compliance_analysis: null,
    recommendation: null,
    alternatives: null,
    missing_information: null,
    evidence_quality: null,
    uncertainty: null,
    verification: null,
    policy_references: null,
    evidence_references: null,
    created_at: createdAt,
  };

  mockCaseAnalyses[caseId] = [...attempts, summary];
  mockAnalysisDetails[analysisId] = detail;
  mockAnalysisReadyAt[analysisId] = Date.now() + 750;
  setMockAnalysisActive(caseId, true);
  appendMockHistory(caseId, {
    event_type: "AI_ANALYSIS_STARTED",
    actor: null,
    actor_role: null,
    analysis_id: analysisId,
    analysis_version: version,
    metadata: {},
  });
}

function completeReadyMockAnalyses(caseId: string): void {
  const attempts = mockCaseAnalyses[caseId] || [];
  for (const item of attempts) {
    if (
      item.status !== "GENERATING" ||
      !mockAnalysisReadyAt[item.id] ||
      Date.now() < mockAnalysisReadyAt[item.id]
    ) {
      continue;
    }

    const base = mockAnalysisDetails["analysis-v1"];
    item.status = "COMPLETED";
    item.verification_status = "PASS";
    mockAnalysisDetails[item.id] = {
      ...base,
      id: item.id,
      version: item.version,
      status: "COMPLETED",
      summary:
        item.version === 1
          ? base.summary
          : `Re-analysis version ${item.version} incorporates the latest reviewer or execution feedback while preserving policy-grounded provenance.`,
      created_at: item.created_at || new Date().toISOString(),
    };
    mockCurrentAnalysisMap[caseId] = item.id;
    updateMockCase(caseId, {
      status: "CHECKING",
      current_analysis: {
        id: item.id,
        version: item.version,
        verification_status: "PASS",
      },
    });
    delete mockAnalysisReadyAt[item.id];
    setMockAnalysisActive(caseId, false);
    appendMockHistory(caseId, {
      event_type: "AI_ANALYSIS_COMPLETED",
      actor: null,
      actor_role: null,
      analysis_id: item.id,
      analysis_version: item.version,
      metadata: { verification_status: "PASS" },
    });
  }
}

function advanceMockAnalysis(caseId: string): void {
  startMockAnalysisIfNeeded(caseId);
  completeReadyMockAnalyses(caseId);
}

registerMockAnalysisStarter(startMockAnalysisIfNeeded);

export async function getAnalyses(
  caseId: string
): Promise<AnalysisSummaryItem[]> {
  try {
    const res = await apiGet<
      AnalysisSummaryItem[] | { data: AnalysisSummaryItem[] }
    >(`/cases/${caseId}/analyses`);
    if (Array.isArray(res)) return res;
    if (res && "data" in res && Array.isArray(res.data)) return res.data;
    return [];
  } catch (err: unknown) {
    if (!shouldUseApiFallback(err)) throw err;
    if (
      err &&
      typeof err === "object" &&
      "status" in err &&
      (err as { status?: number }).status === 401
    ) {
      throw err;
    }
    advanceMockAnalysis(caseId);
    return (mockCaseAnalyses[caseId] || []).map((item) => ({ ...item }));
  }
}

export async function getCurrentAnalysis(
  caseId: string
): Promise<AnalysisDetail> {
  try {
    const res = await apiGet<AnalysisDetail | { data: AnalysisDetail }>(
      `/cases/${caseId}/analyses/current`
    );
    if (res && "data" in res && !("id" in res)) {
      return (res as { data: AnalysisDetail }).data;
    }
    return res as AnalysisDetail;
  } catch (err: unknown) {
    if (!shouldUseApiFallback(err)) throw err;
    if (
      err &&
      typeof err === "object" &&
      "status" in err &&
      (err as { status?: number }).status === 401
    ) {
      throw err;
    }
    advanceMockAnalysis(caseId);
    const currentId = mockCurrentAnalysisMap[caseId];
    if (currentId && mockAnalysisDetails[currentId]) {
      return { ...mockAnalysisDetails[currentId] };
    }
    throw {
      status: 404,
      code: "ANALYSIS_NOT_FOUND",
      message: "No current analysis found for this case.",
    };
  }
}

export async function getAnalysisById(
  caseId: string,
  analysisId: string
): Promise<AnalysisDetail> {
  try {
    const res = await apiGet<AnalysisDetail | { data: AnalysisDetail }>(
      `/cases/${caseId}/analyses/${analysisId}`
    );
    if (res && "data" in res && !("id" in res)) {
      return (res as { data: AnalysisDetail }).data;
    }
    return res as AnalysisDetail;
  } catch (err: unknown) {
    if (!shouldUseApiFallback(err)) throw err;
    if (
      err &&
      typeof err === "object" &&
      "status" in err &&
      (err as { status?: number }).status === 401
    ) {
      throw err;
    }
    advanceMockAnalysis(caseId);
    const item = mockAnalysisDetails[analysisId];
    if (item) {
      return { ...item };
    }
    throw {
      status: 404,
      code: "ANALYSIS_NOT_FOUND",
      message: `Analysis ${analysisId} not found.`,
    };
  }
}
