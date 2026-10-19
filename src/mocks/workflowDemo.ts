/**
 * JAWIR Sentinel - Deterministic Workflow Demo Fixtures
 * 
 * Provides end-to-end synthetic scenarios for offline verification
 * of the complete locked MVP workflow (per workflow.md & api-contract.md).
 */

import { CaseDetail } from "@/types/case";
import { AnalysisDetail, AnalysisSummaryItem } from "@/types/analysis";
import { CheckerStatusData } from "@/types/review";
import { ExecutionItem } from "@/types/execution";
import { CaseHistoryEvent } from "@/types/history";

export interface WorkflowScenarioStep {
  step: number;
  label: string;
  caseStatus: string;
  analysisVersion: number;
  actor: string;
  description: string;
}

export const settlementExceptionDemoSteps: WorkflowScenarioStep[] = [
  {
    step: 1,
    label: "Case Created & Drafted",
    caseStatus: "DRAFT",
    analysisVersion: 0,
    actor: "Maker (usr-ops)",
    description: "Maker creates case, attaches discrepancy log evidence, and assigns strict SoD participants.",
  },
  {
    step: 2,
    label: "Case Submitted",
    caseStatus: "AI_ANALYSIS",
    analysisVersion: 1,
    actor: "Maker (usr-ops)",
    description: "Maker submits case with confirmation. Case details freeze. AI analysis generates in background.",
  },
  {
    step: 3,
    label: "Analysis v1 Completed",
    caseStatus: "CHECKING",
    analysisVersion: 1,
    actor: "SYSTEM",
    description: "AI analysis v1 finishes with PASS status grounded in SOP-OPS-001. Case enters CHECKING phase.",
  },
  {
    step: 4,
    label: "Checker Rejection & Re-analysis",
    caseStatus: "AI_ANALYSIS",
    analysisVersion: 2,
    actor: "Risk Checker (usr-risk)",
    description: "Risk Checker rejects v1 noting evening batch cutoff exceptions. System initiates governed re-analysis v2.",
  },
  {
    step: 5,
    label: "Analysis v2 Completed & Approved",
    caseStatus: "CHECKING",
    analysisVersion: 2,
    actor: "Risk Checker (usr-risk)",
    description: "Analysis v2 completes incorporating secondary criteria. Required Checkers approve, quorum met.",
  },
  {
    step: 6,
    label: "Signer Executive Authorization",
    caseStatus: "EXECUTION",
    analysisVersion: 2,
    actor: "Executive Signer (usr-manager)",
    description: "Executive Signer reviews and authorizes case for execution. Case enters EXECUTION status.",
  },
  {
    step: 7,
    label: "Execution Started & Completed",
    caseStatus: "DONE",
    analysisVersion: 2,
    actor: "Executer (usr-dev)",
    description: "Executer starts operational isolation and reports SUCCESS with balanced settlement result. Case transitions to permanent DONE.",
  },
];

export const escalationDemoScenarios = {
  verifierFail: {
    title: "AI Analysis Verification Failure",
    cause: "VERIFIER_FAIL",
    description: "AI generated an invalid or hallucinated policy reference (SOP-OPS-999). Verifier rejected output with FAIL.",
  },
  technicalRetryExhausted: {
    title: "Technical Retry Limit Exhausted",
    cause: "TECHNICAL_RETRY_EXHAUSTED",
    description: "Vertex AI model service timeout occurred repeatedly. All configured technical retries (AI_TECHNICAL_MAX_RETRIES=2) failed.",
  },
  reanalysisLimitReached: {
    title: "Business Re-analysis Quota Limit Reached",
    cause: "REANALYSIS_LIMIT_REACHED",
    description: "Maximum 3 business re-analyses (up to v4) exhausted following repeated rejections. Case transitioned to ESCALATION_REQUIRED without allocating new versions.",
  },
};
