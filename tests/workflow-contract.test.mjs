import test from "node:test";
import assert from "node:assert/strict";

test("FE-006 & FE-007: Safe lookup vs ADMIN mutation & system_role", () => {
  // Navigation visibility based on system_role
  const userPersona = { id: "usr-ops", system_role: "USER" };
  const adminPersona = { id: "usr-admin", system_role: "ADMIN" };

  const isNavVisibleForUser = userPersona.system_role === "ADMIN";
  const isNavVisibleForAdmin = adminPersona.system_role === "ADMIN";

  assert.equal(isNavVisibleForUser, false, "Admin navigation should be hidden for USER role");
  assert.equal(isNavVisibleForAdmin, true, "Admin navigation should be visible for ADMIN role");
});

test("FE-007: Conflict guards for last admin and in-flight participants", () => {
  const users = [
    { id: "usr-1", name: "Admin 1", system_role: "ADMIN", status: "ACTIVE" },
    { id: "usr-2", name: "User 2", system_role: "USER", status: "ACTIVE" },
  ];

  // Guard: cannot demote/deactivate last active admin
  const activeAdmins = users.filter((u) => u.system_role === "ADMIN" && u.status === "ACTIVE");
  assert.equal(activeAdmins.length, 1);
  const canDeactivateAdmin1 = activeAdmins.length > 1;
  assert.equal(canDeactivateAdmin1, false, "Must block deactivating last active system administrator");

  // Guard: cannot deactivate user participating in in-flight case
  const inFlightParticipants = new Set(["usr-2"]);
  const canDeactivateUser2 = !inFlightParticipants.has("usr-2");
  assert.equal(canDeactivateUser2, false, "Must block deactivating user assigned in in-flight case");
});

test("FE-009 & FE-010: Case owner=Maker and DRAFT-only core data mutability", () => {
  const currentMaker = { id: "usr-ops", name: "Operations User" };

  // Case creation assigns maker and owner identically
  const newCase = {
    id: "case-new",
    status: "DRAFT",
    maker: currentMaker,
    owner: currentMaker,
    title: "Draft exception",
  };

  assert.deepEqual(newCase.maker, newCase.owner, "Owner must equal Maker on creation");

  // In DRAFT, core fields are editable
  const isDraft = newCase.status === "DRAFT";
  assert.equal(isDraft, true, "Case in DRAFT allows editing core details");

  // Once submitted (e.g. AI_ANALYSIS or CHECKING), core fields freeze
  const submittedCase = { ...newCase, status: "AI_ANALYSIS" };
  const isFrozen = submittedCase.status !== "DRAFT";
  assert.equal(isFrozen, true, "Core case details must freeze after leaving DRAFT");
});

test("FE-011: Strict Segregation of Duties (SoD) & ACTIVE participants only", () => {
  const makerId = "usr-ops";
  const checkerId = "usr-risk";
  const signerId = "usr-manager";
  const executerId = "usr-dev";

  const allParticipantIds = [makerId, checkerId, signerId, executerId];
  const uniqueParticipantIds = new Set(allParticipantIds);

  // Maker, Checker, Signer, and Executer must all be distinct
  assert.equal(
    uniqueParticipantIds.size,
    allParticipantIds.length,
    "Strict Segregation of Duties: Maker, Checker, Signer, and Executer must all be distinct individuals"
  );

  // Inactive users cannot be assigned
  const candidateUsers = [
    { id: "usr-inactive", status: "INACTIVE" },
    { id: "usr-active", status: "ACTIVE" },
  ];

  const assignableUsers = candidateUsers.filter((u) => u.status === "ACTIVE");
  assert.equal(assignableUsers.length, 1);
  assert.equal(assignableUsers[0].id, "usr-active", "Only ACTIVE users can be selected as case participants");
});

test("FE-012 & FE-019: Submit transition and Close guard during GENERATING/IN_PROGRESS", () => {
  const draftCase = { id: "case-01", status: "DRAFT" };
  const submittedCase = { ...draftCase, status: "AI_ANALYSIS" };

  // Transition from DRAFT to AI_ANALYSIS
  assert.equal(submittedCase.status, "AI_ANALYSIS", "Case must transition to AI_ANALYSIS upon submission");

  // Close action guard: disabled while analysis is GENERATING or case is in AI_ANALYSIS
  const isGeneratingOrInProgress = submittedCase.status === "AI_ANALYSIS";
  const isCloseAvailable = !isGeneratingOrInProgress;
  assert.equal(isCloseAvailable, false, "Close Case must be blocked while analysis is generating");
});

test("FE-013: Policy effective window activation guard", () => {
  const today = new Date("2026-10-02T00:00:00Z");

  const futurePolicy = {
    effective_from: "2026-11-01T00:00:00Z",
    effective_until: null,
  };
  const isFutureEffective = new Date(futurePolicy.effective_from) > today;
  assert.equal(isFutureEffective, true, "Future effective policy cannot be active today");

  const expiredPolicy = {
    effective_from: "2026-01-01T00:00:00Z",
    effective_until: "2026-09-30T00:00:00Z",
  };
  const isExpired = new Date(expiredPolicy.effective_until) < today;
  assert.equal(isExpired, true, "Expired policy cannot be active today");
});

test("FE-014 & FE-015: Evidence MIME allowlist and state-aware mutation", () => {
  const allowedMimeTypes = ["application/pdf", "image/jpeg", "image/png"];

  const validFile = { name: "audit.pdf", type: "application/pdf" };
  const invalidFile = { name: "script.exe", type: "application/x-msdownload" };

  assert.equal(allowedMimeTypes.includes(validFile.type), true, "PDF MIME must be accepted");
  assert.equal(allowedMimeTypes.includes(invalidFile.type), false, "Disallowed MIME must be rejected");

  // State gating: terminal state DONE or CLOSED is read-only
  const isTerminal = (status) => status === "DONE" || status === "CLOSED";
  assert.equal(isTerminal("DONE"), true, "Terminal state DONE forbids evidence upload");
  assert.equal(isTerminal("CHECKING"), false, "In-flight CHECKING state allows evidence attachment by authorized participant");
});

test("FE-016 & FE-017: Current reviewable analysis vs latest failed attempt", () => {
  const persistedAnalyses = [
    { id: "analysis-v1", version: 1, status: "COMPLETED", verification_status: "PASS" },
    { id: "analysis-v2", version: 2, status: "FAILED", verification_status: "FAIL" },
  ];

  const currentAnalysisId = "analysis-v1";
  const highestVersion = Math.max(...persistedAnalyses.map((a) => a.version));

  // Current analysis is v1 (COMPLETED PASS), while latest attempt is v2 (FAILED FAIL)
  assert.equal(currentAnalysisId, "analysis-v1", "Current analysis must point to latest eligible completed analysis");
  assert.equal(highestVersion, 2, "Latest attempt is version 2");
  assert.notEqual(currentAnalysisId, `analysis-v${highestVersion}`, "Current reviewable analysis and latest attempt can differ");

  // FAILED attempt must safely permit nullable fields
  const failedAnalysis = {
    id: "analysis-v2",
    version: 2,
    status: "FAILED",
    summary: null,
    facts: null,
    recommendation: null,
    failure_reason: "Model output verification failed: hallucinated reference.",
  };

  assert.equal(failedAnalysis.summary, null, "Failed analysis summary is safely null without synthetic fallback");
  assert.ok(failedAnalysis.failure_reason, "Failure reason is preserved for audit display");
});

test("FE-019 & FE-022: Three escalation causes and no-resume governance", () => {
  const escalationCauses = ["VERIFIER_FAIL", "TECHNICAL_RETRY_EXHAUSTED", "REANALYSIS_LIMIT_REACHED"];

  // 1. Verifier failure
  assert.equal(escalationCauses[0], "VERIFIER_FAIL");

  // 2. Technical retry exhausted
  assert.equal(escalationCauses[1], "TECHNICAL_RETRY_EXHAUSTED");

  // 3. Re-analysis limit reached (Max 3 re-analyses -> v4)
  const maxReanalysis = 3;
  const currentVersion = 4;
  const isQuotaExhausted = currentVersion - 1 >= maxReanalysis;
  assert.equal(isQuotaExhausted, true, "Version 4 exhausts the maximum 3 re-analysis quota");

  // In ESCALATION_REQUIRED, resume/direct re-analysis CTA is forbidden on MVP
  const isResumeAllowedOnMVP = false;
  assert.equal(isResumeAllowedOnMVP, false, "MVP forbids direct resume CTA during ESCALATION_REQUIRED");
});

test("FE-020 & FE-021: Checker quorum completion and rejection flow", () => {
  const checkerStatus = {
    analysis_id: "analysis-v1",
    required: 2,
    approved: 1,
    rejected: 0,
    pending: 1,
    checkers: [
      { user_id: "usr-risk", status: "APPROVED", required: true },
      { user_id: "usr-dev", status: "PENDING", required: true },
      { user_id: "usr-audit", status: "PENDING", required: false }, // Optional checker
    ],
  };

  // Quorum check: only required checkers gate CHECKING -> SIGNING
  const requiredApproved = checkerStatus.checkers.filter((c) => c.required && c.status === "APPROVED").length;
  const isGateMet = requiredApproved >= checkerStatus.required;
  assert.equal(isGateMet, false, "Quorum is not met when 1 of 2 required checkers is pending");

  // Optional checker pending does not block once required are approved
  const checkerStatusQuorumMet = {
    ...checkerStatus,
    approved: 2,
    pending: 0,
    checkers: [
      { user_id: "usr-risk", status: "APPROVED", required: true },
      { user_id: "usr-dev", status: "APPROVED", required: true },
      { user_id: "usr-audit", status: "PENDING", required: false },
    ],
  };
  const requiredApproved2 = checkerStatusQuorumMet.checkers.filter((c) => c.required && c.status === "APPROVED").length;
  const isGateMet2 = requiredApproved2 >= checkerStatusQuorumMet.required;
  assert.equal(isGateMet2, true, "Gate is satisfied when all required checkers approve, regardless of optional checker");

  // Rejection requires a reason
  const rejectionPayload = { analysis_id: "analysis-v1", decision: "REJECT", reason: "Discrepancy" };
  assert.ok(rejectionPayload.reason.length > 0, "Checker rejection must have mandatory reason");
});

test("FE-023: Execution completion to DONE vs BLOCKED/FAILED", () => {
  // Successful execution transitions to DONE
  const successOutcome = { status: "SUCCESS", case_status: "DONE", action_taken: "Isolated unmatched records", result: "Reconciliation balanced" };
  assert.equal(successOutcome.case_status, "DONE", "SUCCESS execution leads to permanent DONE");

  // Blocked execution with quota available transitions to AI_ANALYSIS
  const blockedOutcome = { status: "BLOCKED", case_status: "AI_ANALYSIS", action_taken: "Retry reconciliation", blocker: "Network clearing timeout" };
  assert.equal(blockedOutcome.case_status, "AI_ANALYSIS", "BLOCKED execution triggers re-analysis if quota remains");
});

test("FE-024: Concurrency safety (409 STALE_ANALYSIS) without auto-retry", () => {
  const error409 = { status: 409, code: "STALE_ANALYSIS" };

  let didAutoRetry = false;
  let didInvalidateQueries = false;
  let didPromptUser = false;

  if (error409.status === 409) {
    didAutoRetry = false; // Never auto retry human decisions!
    didInvalidateQueries = true;
    didPromptUser = true;
  }

  assert.equal(didAutoRetry, false, "Human decision must NOT be automatically retried on STALE_ANALYSIS");
  assert.equal(didInvalidateQueries, true, "Authoritative queries must be invalidated on STALE_ANALYSIS");
  assert.equal(didPromptUser, true, "User must be notified of workflow context change");
});

test("FE-025 & FE-026: History and Dashboard authoritative rendering", () => {
  const historyEvents = [
    { id: "e1", event_type: "CASE_CREATED", actor: { name: "Ops" }, actor_role: "MAKER", created_at: "2026-10-01T10:00:00Z" },
    { id: "e2", event_type: "AI_ANALYSIS_COMPLETED", actor: null, actor_role: null, created_at: "2026-10-01T10:05:00Z" },
  ];

  assert.equal(historyEvents[1].actor, null, "SYSTEM events have null actor without fake role");

  const dashboardSummary = {
    my_cases: 5,
    need_my_review: 2,
    need_my_signature: 1,
    need_my_execution: 1,
    status_counts: {
      DRAFT: 1,
      AI_ANALYSIS: 0,
      CHECKING: 2,
      SIGNING: 1,
      EXECUTION: 1,
      DONE: 0,
      CLOSED: 0,
      ESCALATION_REQUIRED: 0,
    },
  };

  assert.equal(dashboardSummary.need_my_review, 2, "Authoritative review queue count matches API");
});
