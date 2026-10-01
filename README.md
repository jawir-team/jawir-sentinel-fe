# JAWIR Sentinel Frontend

**Specification Version:** 1.0  
**Status:** MVP Implementation Baseline  
**Repository:** `jawir-sentinel-fe`

Frontend web application untuk **JAWIR Sentinel**, sebuah AI-assisted governed decision workflow untuk financial operations.

Frontend bertanggung jawab atas:

- user interface;
- navigation;
- authentication flow;
- case creation and case monitoring;
- AI analysis presentation;
- policy and evidence presentation;
- Checker review interface;
- Signer authorization interface;
- execution interface;
- audit timeline;
- Unit, User, Case Type, dan Policy Management UI;
- API integration;
- frontend deployment.

Frontend **bukan source of truth** untuk workflow, authorization, approval validity, atau state transition.

Semua business rule tetap divalidasi oleh backend.

---

# 1. Core Principle

> **Frontend presents state and captures intent. Backend owns business truth.**

Frontend bertugas:

```text
Display
↓
Collect User Intent
↓
Call Backend API
↓
Render Authoritative Result
```

Frontend tidak boleh:

- menentukan workflow transition sendiri;
- menganggap button visibility sebagai authorization;
- mengubah case status secara lokal sebagai source of truth;
- menganggap approval berhasil sebelum backend mengonfirmasi;
- menggunakan analysis lama setelah backend mengembalikan `STALE_ANALYSIS`.

---

# 2. Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js |
| Language | TypeScript |
| Routing | Next.js App Router |
| Styling | Tailwind CSS |
| Data Fetching / Server State | TanStack Query |
| Form | React Hook Form |
| Validation | Zod |
| Authentication | Firebase Authentication |
| API Transport | Fetch API |
| Runtime | Google Cloud Run |
| CI/CD | GitHub Actions + Docker |

Frontend menggunakan strict TypeScript.

---

# 3. Repository Structure

```text
jawir-sentinel-fe/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (app)/
│   │   ├── layout.tsx
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── feedback/
│   │   └── common/
│   │
│   ├── features/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── case/
│   │   ├── analysis/
│   │   ├── evidence/
│   │   ├── review/
│   │   ├── execution/
│   │   ├── policy/
│   │   ├── user/
│   │   ├── unit/
│   │   ├── casetype/
│   │   └── audit/
│   │
│   ├── services/
│   │   ├── api/
│   │   └── firebase/
│   │
│   ├── hooks/
│   ├── lib/
│   ├── types/
│   ├── constants/
│   └── mocks/
│
├── public/
├── .github/
│   └── workflows/
├── Dockerfile
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

---

# 4. Source Responsibility

## `src/app`

Next.js route structure dan page composition.

Business-specific UI logic tidak diletakkan langsung sebagai large page component.

---

## `src/components/ui`

Reusable primitive components:

```text
Button
Input
Textarea
Select
Badge
Card
Modal
Dialog
Tabs
Table
Pagination
Tooltip
Skeleton
Alert
```

---

## `src/components/layout`

Application shell:

```text
AppSidebar
AppHeader
PageHeader
ContentContainer
```

---

## `src/components/feedback`

Reusable feedback state:

```text
LoadingState
EmptyState
ErrorState
ForbiddenState
ConflictState
```

---

## `src/features`

Business-domain frontend modules.

Setiap feature memiliki component, hooks, schema, dan mapper yang relevan.

Contoh:

```text
features/case/
├── components/
├── hooks/
├── schemas/
├── mappers/
└── types.ts
```

---

## `src/services/api`

Semua komunikasi ke backend.

Tidak ada direct fetch tersebar di page/component.

```text
services/api/
├── client.ts
├── auth.ts
├── dashboard.ts
├── cases.ts
├── analyses.ts
├── evidences.ts
├── reviews.ts
├── executions.ts
├── policies.ts
├── users.ts
├── units.ts
└── case-types.ts
```

---

## `src/services/firebase`

Firebase client initialization dan auth helper.

---

## `src/types`

Shared API-facing types.

Types harus mengikuti API contract pada:

```text
jawir-sentinel-docs/api/api-contract.md
```

---

# 5. Application Routes

```text
/login

/dashboard

/cases
/cases/new
/cases/[caseId]

/policies
/policies/new
/policies/[policyId]

/users
/units
/case-types
```

---

# 6. Application Layout

Authenticated pages menggunakan layout:

```text
┌────────────────────────────────────────────────────────┐
│ Header                                                 │
├───────────────┬────────────────────────────────────────┤
│               │                                        │
│ Sidebar       │ Main Content                           │
│               │                                        │
│ Dashboard     │                                        │
│ Cases         │                                        │
│ Policies      │                                        │
│ Users         │                                        │
│ Units         │                                        │
│ Case Types    │                                        │
│               │                                        │
└───────────────┴────────────────────────────────────────┘
```

Sidebar navigation ditampilkan berdasarkan user context.

```text
USER
→ Dashboard / Cases
→ safe read-only reference views as exposed by API

ADMIN
→ all USER navigation
→ Policies
→ Users
→ Units
→ Case Types
```

ADMIN is a system role only; it does not make a user Checker/Signer/Executer on a case.

Admin menu:

```text
Policies
Users
Units
Case Types
```

Backend tetap memvalidasi authorization.

---

# 7. Authentication Flow

Authentication menggunakan Firebase Authentication.

Flow:

```text
User
  ↓
Firebase Sign In
  ↓
Firebase ID Token
  ↓
Frontend stores auth session through Firebase SDK
  ↓
GET /api/v1/me
  ↓
Internal Sentinel User Loaded
  ↓
Application Shell
```

Setiap API request mengirim:

```http
Authorization: Bearer <firebase-id-token>
```

Jika backend mengembalikan:

```http
401 Unauthorized
```

frontend:

1. mencoba refresh Firebase token;
2. retry request satu kali;
3. jika tetap gagal, logout;
4. redirect ke `/login`.

---

# 8. Current User Model

Frontend membutuhkan current user:

```ts
type CurrentUser = {
  id: string;
  name: string;
  email: string;
  system_role: "USER" | "ADMIN";
  unit: {
    id: string;
    code: string;
    name: string;
  };
};
```

Current user digunakan untuk:

- header identity;
- navigation presentation;
- action visibility;
- current assignment highlight.

Current user tidak digunakan sebagai pengganti backend authorization.

---

# 9. Dashboard

Route:

```text
/dashboard
```

API:

```http
GET /api/v1/dashboard/summary
```

Dashboard menampilkan:

```text
My Cases
Need My Review
Need My Signature
Need My Execution
```

Status summary:

```text
DRAFT
AI_ANALYSIS
CHECKING
SIGNING
EXECUTION
DONE
CLOSED
ESCALATION_REQUIRED
```

Dashboard card dapat menjadi link ke filtered case list.

---

# 10. Case List

Route:

```text
/cases
```

Data source:

```http
GET /api/v1/cases
```

Supported filter:

```text
status
urgency
case_type_id
assigned_to_me
page
limit
```

Table columns:

```text
Case Number
Title
Case Type
Urgency
Status
Current Assignment
Updated At
```

Interaction:

```text
Row Click → /cases/[caseId]
```

Case status ditampilkan menggunakan badge.

---

# 11. Create Case

Route:

```text
/cases/new
```

Form:

```text
Case Type *
Title *
Description *
Urgency *
```

Validation:

```text
case_type_id → required
title        → required, max 255
description  → required
urgency      → LOW | MEDIUM | HIGH | CRITICAL
```

Submit:

```http
POST /api/v1/cases
```

Setelah berhasil:

```text
redirect → /cases/{caseId}
```

Case baru berada pada:

```text
DRAFT
```

Backend automatically sets:

```text
Maker = current user
Owner = current user
```

---

# 12. Case Detail

Route:

```text
/cases/[caseId]
```

Case Detail merupakan halaman utama workflow.

Layout:

```text
┌──────────────────────────────────────────────────────┐
│ Case Number      Title                  Status       │
│ Case Type        Urgency                             │
├──────────────────────────────────────────────────────┤
│ Overview | AI Analysis | Evidence | Reviews |       │
│ Execution | History                                 │
├──────────────────────────────────────────────────────┤
│ Tab Content                                          │
└──────────────────────────────────────────────────────┘
```

Primary API:

```http
GET /api/v1/cases/{case_id}
```

Case detail harus selalu mengikuti response backend terbaru.

---

# 13. Case Overview

Overview menampilkan:

```text
Case Number
Case Type
Title
Description
Urgency
Status
Maker
Owner
Participants
Created At
```

Jika case `DRAFT` dan current user adalah Maker:

```text
Edit Case
Assign Participant
Remove Participant
Submit Case
```

---

# 14. Participant Assignment

Participant roles:

```text
MAKER
CHECKER
SIGNER
EXECUTER
```

UI assignment:

```text
Role
User
Required
```

API:

```http
POST /api/v1/cases/{case_id}/participants
DELETE /api/v1/cases/{case_id}/participants/{participant_id}
```

Frontend dapat mencegah obvious invalid selection berdasarkan current participant state, tetapi backend tetap melakukan final validation.

Locked cardinality:

```text
MAKER     exactly 1, creator, immutable
CHECKER   1..N, at least 1 required
SIGNER    exactly 1
EXECUTER  exactly 1

Every active role must use a different user.
```

Participant assignment controls are available only while the case is `DRAFT`. After submit, participant context is read-only.

Contoh UI prevention:

```text
Any user already holding an ACTIVE role is excluded from all other role selectors.
Maker tidak ditampilkan pada Checker/Signer/Executer options.
```

---

# 15. Submit Case

Action tersedia jika:

```text
case.status = DRAFT
current user = Maker
```

Saat user menekan Submit:

```text
Confirmation Dialog
↓
POST /cases/{id}/submit
↓
Refetch Case
```

Successful submit freezes case core data and participant assignments.

Setelah submit:

```text
status → AI_ANALYSIS
```

UI menampilkan:

```text
AI analysis is queued / being generated.
```

Submit only waits for the backend database transaction. Gemini processing runs asynchronously through the backend worker/RabbitMQ path.

Frontend tidak memanggil Gemini atau RabbitMQ secara langsung.

---

# 16. Case Status Presentation

Status label:

| Status | Display |
|---|---|
| DRAFT | Draft |
| SUBMITTED | Submitted |
| AI_ANALYSIS | AI Analysis |
| CHECKING | Checking |
| SIGNING | Signing |
| EXECUTION | Execution |
| DONE | Done |
| CLOSED | Closed |
| ESCALATION_REQUIRED | Escalation Required |

Frontend tidak memiliki logic untuk menghitung next status.

---

# 17. AI Analysis View

Tab:

```text
AI Analysis
```

API:

```http
GET /api/v1/cases/{case_id}/analyses/current
GET /api/v1/cases/{case_id}/analyses
GET /api/v1/cases/{case_id}/analyses/{analysis_id}
```

Layout:

```text
Analysis v2
Verification: PASS_WITH_WARNING

Summary

Facts
Assumptions
Unknowns

Risk Analysis
Compliance Analysis

Recommendation
Alternatives

Missing Information

Policy References
Evidence References

Evidence Quality
Uncertainty
```

---

# 18. Analysis Version Selector

Jika case memiliki lebih dari satu analysis:

```text
Analysis v1
Analysis v2
Analysis v3
```

`CURRENT` means `cases.current_analysis_id`: the latest COMPLETED PASS/PASS_WITH_WARNING analysis that became reviewable.

`LATEST ATTEMPT` means the highest persisted analysis version. These labels can differ:

```text
v1 COMPLETED PASS  → CURRENT
v2 FAILED          → LATEST ATTEMPT
```

Historical and FAILED versions are read-only.

Action Checker/Signer hanya tersedia when case state permits it and the displayed analysis equals `current_analysis_id`.

---

# 19. Analysis Facts

Fact item menampilkan:

```text
statement
source type
source reference
```

Contoh:

```text
37 transactions are unmatched.

Source:
Evidence EV-001
```

Source reference dapat membuka evidence/policy yang terkait.

---

# 20. Assumptions and Unknowns

Assumption card:

```text
Statement
Reason
```

Unknown card:

```text
Item
Impact
```

Unknowns harus terlihat jelas agar reviewer tidak menganggapnya sebagai fact.

---

# 21. Risk Analysis

Setiap risk menampilkan:

```text
Risk Type
Risk Level
Reason
Evidence References
Policy References
```

Risk level:

```text
LOW
MEDIUM
HIGH
CRITICAL
```

---

# 22. Compliance Analysis

UI menampilkan:

```text
Status
Reason
Policy References
```

Status:

```text
NO_ISSUE_IDENTIFIED
POTENTIAL_CONCERN
REQUIRES_REVIEW
```

---

# 23. Recommendation

Recommendation menampilkan:

```text
Recommendation Type
Summary
Ordered Actions
Reason
Policy References
Evidence References
Potential Benefits
Potential Risks
```

Recommendation type:

```text
POLICY_BASED
NON_POLICY_RECOMMENDATION
```

`NON_POLICY_RECOMMENDATION` harus memiliki visible warning label.

---

# 24. Verification Result

Status:

```text
PASS
PASS_WITH_WARNING
FAIL
```

`PASS_WITH_WARNING`:

- analysis tetap dapat direview;
- warning ditampilkan secara visible.

`FAIL`:

- analysis tidak diperlakukan sebagai reviewable analysis;
- failed attempt tetap dapat tampil di history/version selector;
- case berakhir `ESCALATION_REQUIRED`;
- UI tidak menawarkan retry/reanalyze/resume pada MVP.

---

# 25. Policy Reference UI

Reference menampilkan:

```text
Policy Code
Policy Title
Version
Section
Excerpt
```

Example:

```text
SOP-RISK-001
Operational Risk Escalation
Version 1.2
Section 4.2
```

Policy reference membuka drawer/modal detail tanpa meninggalkan case page.

---

# 26. Evidence Tab

Tab:

```text
Evidence
```

API:

```http
GET /api/v1/cases/{case_id}/evidences
POST /api/v1/cases/{case_id}/evidences
```

Evidence card:

```text
Title
Type
Source Role
Source User
Created At
Content / File Link
```

Evidence type:

```text
COMMENT
DOCUMENT
LOG
SCREENSHOT
REFERENCE
EXECUTION_RESULT
```

---

# 27. Add Text Evidence

Form:

```text
Acting Role
Evidence Type
Title
Content
```

User-created evidence authorization:

```text
DRAFT               → Maker only
CHECKING             → active participant
SIGNING              → active participant
EXECUTION            → active participant
ESCALATION_REQUIRED  → active participant

SUBMITTED / AI_ANALYSIS / DONE / CLOSED
→ read-only for user evidence
```

Frontend does not send an acting role. Strict SoD guarantees one active workflow role per user/case, so backend derives source role from the authenticated participant assignment. SYSTEM is internal-only.

API:

```http
POST /api/v1/cases/{case_id}/evidences
```

Setelah berhasil:

```text
invalidate evidence query
refetch evidence list
```

---

# 28. File Evidence Upload

Supported files:

```text
PDF   → application/pdf
JPEG  → image/jpeg
PNG   → image/png
```

Flow:

```text
Select supported file
↓
POST /evidences/upload-url with mime_type
↓
Receive signed URL + file key
↓
Upload directly to Cloud Storage
↓
POST /evidences/file
↓
Backend verifies object/key/MIME
↓
Evidence Created
```

Upload UI menampilkan:

```text
Preparing
Uploading
Registering
Completed
Failed
```

Unsupported MIME is blocked client-side for UX and still validated by backend.

Supported file evidence can later be consumed directly by Gemini from GCS; frontend does not run OCR or parse the document.

File tidak dikirim melalui Next.js server sebagai proxy.

---

# 29. Checker Review

Action hanya ditampilkan jika:

```text
case.status = CHECKING
current user assigned as CHECKER
current analysis = displayed analysis
checker has no decision for current analysis
```

Backend tetap menjadi final authority.

UI:

```text
Approve
Reject
```

---

# 30. Checker Approve

Dialog:

```text
Analysis Version
Comment
Approve Button
```

API:

```http
POST /api/v1/cases/{case_id}/checker-decisions
```

Payload:

```json
{
  "analysis_id": "uuid",
  "decision": "APPROVE",
  "comment": "Reasoning and evidence are acceptable."
}
```

Setelah sukses:

```text
invalidate case
invalidate current analysis
invalidate checker status
invalidate history
```

Jika Checker terakhir:

```text
backend moves case → SIGNING
```

Frontend hanya merender hasil refetch.

---

# 31. Checker Reject

Reject form:

```text
Reason *
Comment
Evidence
```

Payload:

```json
{
  "analysis_id": "uuid",
  "decision": "REJECT",
  "reason": "Relevant SOP was not considered.",
  "comment": "Include SOP-RISK-004 before continuing.",
  "evidence_ids": []
}
```

Setelah successful reject:

```text
quota available
→ case = AI_ANALYSIS
→ show analysis generation state

quota exhausted
→ case = ESCALATION_REQUIRED
→ rejection tetap tersimpan
→ no new analysis / no AI call
```

Quota exhaustion is a successful reject outcome, not a reverted action.

---

# 32. Checker Status

API:

```http
GET /api/v1/cases/{case_id}/checker-status
```

Presentation:

```text
Risk User      APPROVED
Dev User       PENDING
```

Summary:

```text
1 / 2 required Checkers approved
```

Status:

```text
PENDING
APPROVED
REJECTED
```

---

# 33. Signer Review

Action hanya ditampilkan jika:

```text
case.status = SIGNING
current user assigned as SIGNER
displayed analysis = current analysis
```

Signer view harus menampilkan sebelum decision:

```text
Current Analysis Version
Recommendation
Policy References
Evidence
Checker Decisions
Verification Warnings
```

Actions:

```text
Approve
Reject
```

---

# 34. Signer Approve

API:

```http
POST /api/v1/cases/{case_id}/signer-decision
```

Payload:

```json
{
  "analysis_id": "uuid",
  "decision": "APPROVE",
  "comment": "Authorized for execution."
}
```

Setelah success:

```text
backend → EXECUTION
```

Frontend refetch case.

---

# 35. Signer Reject

Form:

```text
Reason *
Comment
```

Payload:

```json
{
  "analysis_id": "uuid",
  "decision": "REJECT",
  "reason": "Operational impact is too high.",
  "comment": "Provide a lower-impact alternative."
}
```

Setelah successful reject:

```text
quota available  → backend AI_ANALYSIS
quota exhausted  → backend ESCALATION_REQUIRED
```

In both cases the rejection remains persisted.

---

# 36. Execution Tab

Tab:

```text
Execution
```

Visible action jika:

```text
case.status = EXECUTION
current user assigned as EXECUTER
```

Jika belum ada execution:

```text
Start Execution
```

API:

```http
POST /api/v1/cases/{case_id}/executions
```

Payload:

```json
{
  "analysis_id": "uuid"
}
```

---

# 37. Execution Result

Setelah execution `IN_PROGRESS`, Executer dapat memilih:

```text
SUCCESS
BLOCKED
FAILED
```

### Success

Fields:

```text
Action Taken *
Result *
```

### Blocked

Fields:

```text
Action Taken *
Blocker *
Supporting Evidence
```

### Failed

Fields:

```text
Action Taken *
Result *
Blocker *
Supporting Evidence
```

API:

```http
POST /api/v1/cases/{case_id}/executions/{execution_id}/result
```

---

# 38. Execution UI Behavior

Result:

```text
SUCCESS
→ backend DONE
→ show Done state
```

```text
BLOCKED / FAILED with quota available
→ backend AI_ANALYSIS
→ show Re-analysis state

BLOCKED / FAILED with quota exhausted
→ backend ESCALATION_REQUIRED
→ execution result remains persisted
```

Frontend tidak menentukan transition tersebut.

---

# 39. History Tab

Tab:

```text
History
```

API:

```http
GET /api/v1/cases/{case_id}/history
```

Timeline:

```text
10:00 CASE_CREATED
10:02 CASE_SUBMITTED
10:03 AI_ANALYSIS_COMPLETED
10:10 CHECKER_REJECTED
10:12 AI_ANALYSIS_COMPLETED
10:18 CHECKER_APPROVED
10:20 SIGNER_APPROVED
10:25 EXECUTION_BLOCKED
...
```

Event item menampilkan:

```text
Event
Actor
Actor Role
Analysis Version
Timestamp
Relevant Metadata
```

---

# 40. Policy Management

Route:

```text
/policies
```

Table:

```text
Code
Title
Domain
Case Type
Active Version
Status
Updated At
```

API:

```http
GET /api/v1/policies
```

---

# 41. Create Policy

Route:

```text
/policies/new
```

Form:

```text
Code *
Title *
Domain *
Case Type
Description
```

API:

```http
POST /api/v1/policies
```

---

# 42. Policy Detail

Route:

```text
/policies/[policyId]
```

Displays:

```text
Policy Metadata
Version List
Version Status
Effective Date
Content
```

Authority status:

```text
DRAFT
ACTIVE
SUPERSEDED
```

Index status:

```text
NOT_STARTED
PROCESSING
READY
FAILED
```

UI must keep authority status and retrieval readiness visually distinct.

---

# 43. Create Policy Version

Form:

```text
Version *
Content *
Effective From
Effective Until
```

API:

```http
POST /api/v1/policies/{policy_id}/versions
```

Created state:

```text
DRAFT
```

---

# 44. Activate Policy Version

Only `ADMIN` UI displays mutation action:

```text
Activate Version
```

Precondition presentation:

```text
target = DRAFT
effective_from is null or <= now
effective_until is null or > now
```

Future-effective / expired version:

```text
Activate disabled
show why it is not currently effective
```

Confirmation:

```text
Sentinel will build/verify the retrieval index first.
The current ACTIVE version remains authoritative until the target is READY
and final activation succeeds.
```

Index UI:

```text
NOT_STARTED → Activate
PROCESSING + index_recoverable=false → disabled / show processing
PROCESSING + index_recoverable=true  → Recover Indexing
FAILED                              → Retry Activation
READY + DRAFT                       → Activate without re-embedding
```

API:

```http
POST /api/v1/policies/{policy_id}/versions/{version_id}/activate
```

After success/failure:

```text
refetch policy
refetch version
```

---

# 45. User Management

Mutation UI is visible to `ADMIN` only.

Route:

```text
/users
```

Table:

```text
Name
Email
Unit
Status
System Role
```

API:

```http
GET /api/v1/users
POST /api/v1/users
PATCH /api/v1/users/{user_id}
```

Form:

```text
Name
Email
Firebase UID
Unit
Status
System Role (USER | ADMIN)
```

---

# 46. Unit Management

Create/mutation UI is visible to `ADMIN` only; read access may still be used by ordinary workflow forms.

Route:

```text
/units
```

API:

```http
GET /api/v1/units
POST /api/v1/units
```

Form:

```text
Code
Name
Description
```

---

# 47. Case Type Management

Create/mutation UI is visible to `ADMIN` only; read access remains available for case creation.

Route:

```text
/case-types
```

API:

```http
GET /api/v1/case-types
POST /api/v1/case-types
```

Form:

```text
Code
Name
Description
```

---

# 48. API Client

Semua requests melalui:

```text
src/services/api/client.ts
```

Responsibilities:

```text
base URL
Firebase token injection
JSON serialization
error normalization
401 handling
response parsing
```

Conceptual signature:

```ts
apiClient<TResponse, TRequest>({
  method,
  path,
  body
})
```

API feature modules tidak menggunakan Firebase secara langsung.

---

# 49. API Error Model

Backend error:

```ts
type ApiError = {
  error: {
    code: string;
    message: string;
    details: Record<string, unknown>;
  };
};
```

Core error mapping:

| Error | UI Behavior |
|---|---|
| INVALID_REQUEST | Field/global validation feedback |
| UNAUTHORIZED | Refresh token / login |
| FORBIDDEN | Forbidden state |
| SEGREGATION_OF_DUTIES_VIOLATION | Action error dialog |
| CASE_NOT_FOUND | Not Found |
| POLICY_NOT_FOUND | Not Found |
| INVALID_STATE_TRANSITION | Refetch + conflict/wait message |
| STALE_ANALYSIS | Refetch case and current analysis |
| INTERNAL_ERROR | Generic retry state |

---

# 50. Stale Analysis Handling

Jika backend mengembalikan:

```text
409 STALE_ANALYSIS
```

frontend:

```text
Close Decision Dialog
↓
Invalidate Case Query
Invalidate Current Analysis Query
Invalidate Checker Status
↓
Refetch
↓
Show Message:
"A newer analysis version is available. Review the latest analysis before continuing."
```

Frontend tidak retry approval otomatis.

---

# 51. Invalid State Transition Handling

Jika:

```text
409 INVALID_STATE_TRANSITION
```

frontend:

```text
invalidate related queries
refetch server state
show conflict notification
```

User tidak diarahkan untuk retry action terhadap stale UI.

---

# 52. Query Keys

TanStack Query key convention:

```ts
["me"]

["dashboard"]

["cases", filters]
["case", caseId]

["evidences", caseId]

["analyses", caseId]
["analysis", caseId, analysisId]
["analysis-current", caseId]

["checker-status", caseId]

["history", caseId]

["policies", filters]
["policy", policyId]

["users", filters]
["units"]
["case-types"]
```

---

# 53. Mutation Invalidation

### Create Case

Invalidate:

```text
cases
dashboard
```

### Submit Case

Invalidate:

```text
case
cases
dashboard
history
analysis-current
```

### Checker Decision

Invalidate:

```text
case
checker-status
analysis-current
analyses
history
dashboard
```

### Signer Decision

Invalidate:

```text
case
history
dashboard
analysis-current
```

### Execution Result

Invalidate:

```text
case
history
dashboard
analysis-current
analyses
```

---

# 54. Form Validation

Frontend validation menggunakan Zod.

Frontend validation hanya untuk UX.

Backend tetap authoritative.

Example:

```ts
const createCaseSchema = z.object({
  case_type_id: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  urgency: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
});
```

Backend validation error tetap harus dapat dirender.

---

# 55. Loading States

Data loading tidak menggunakan blank page.

Use:

```text
Page Skeleton
Card Skeleton
Table Skeleton
Button Loading State
```

Mutation button:

```text
disabled while pending
```

Double submit harus dicegah pada UI.

Backend tetap harus menangani idempotency/duplicate mutation sesuai contract.

---

# 56. Empty States

Required empty states:

```text
No Cases
No Evidence
No Analysis Yet
No Policy References
No Review History
No Executions
No Policies
```

Empty state harus menjelaskan next action jika applicable.

---

# 57. AI Analysis Loading

Saat:

```text
case.status = AI_ANALYSIS
```

UI:

```text
AI Analysis in Progress

Sentinel is analyzing the current case, evidence, and active policies.
```

Polling dilakukan pada:

```text
GET /cases/{case_id}
```

dan/atau current analysis query dengan interval terbatas.

Polling berhenti ketika case keluar dari `AI_ANALYSIS`.

If the final state is `ESCALATION_REQUIRED`, fetch analysis list/history to distinguish `VERIFIER_FAIL`, `TECHNICAL_RETRY_EXHAUSTED`, or `REANALYSIS_LIMIT_REACHED`.

---

# 58. Action Visibility Matrix

Frontend menggunakan matrix untuk presentation. Backend remains final authority.

| State | Maker | Checker | Signer | Executer |
|---|---|---|---|---|
| DRAFT | Edit / Assign / Submit / Evidence / Close | - | - | - |
| SUBMITTED | View | View | View | View |
| AI_ANALYSIS | View / Close disabled while GENERATING | View | View | View |
| CHECKING | View / Evidence / Close | Approve / Reject / Evidence / Close | View / Evidence / Close | View / Evidence / Close |
| SIGNING | View / Evidence / Close | View / Evidence / Close | Approve / Reject / Evidence / Close | View / Evidence / Close |
| EXECUTION | View / Evidence / Close* | View / Evidence / Close* | View / Evidence / Close* | Execute / Evidence / Close* |
| DONE | View | View | View | View |
| CLOSED | View | View | View | View |
| ESCALATION_REQUIRED | View / Evidence / Close | View / Evidence / Close | View / Evidence / Close | View / Evidence / Close |

`Close*` is disabled while an execution is `IN_PROGRESS`. Close is also unavailable while any analysis is `GENERATING`.

If backend returns `409 INVALID_STATE_TRANSITION` because an active process is running, show “Wait for the current process to finish” and refetch.

---

# 59. Case Action Component

Semua contextual case action dirender melalui satu component boundary:

```text
CaseActions
```

Input:

```text
current user
case
participants
current analysis
latest analysis attempt
checker status
execution
```

`CaseActions` menentukan presentation action berdasarkan current server data.

Mutation tetap memanggil backend.

---

# 60. UI State Source

Server state berasal dari TanStack Query.

Jangan menduplikasi server entity ke global client store.

Local React state hanya untuk:

```text
modal open/close
selected tab
temporary form state
UI preference
```

---

# 61. Type Contract

Frontend API type harus eksplisit.

Example:

```ts
type CaseStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "AI_ANALYSIS"
  | "CHECKING"
  | "SIGNING"
  | "EXECUTION"
  | "DONE"
  | "CLOSED"
  | "ESCALATION_REQUIRED";

type CaseUrgency =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";
```

Tidak menggunakan arbitrary string untuk domain enum.

---

# 62. API Mocking

Frontend development dapat berjalan tanpa backend menggunakan mock API layer.

Folder:

```text
src/mocks/
```

Mock data harus mengikuti exact API contract.

Required scenarios:

```text
Draft Case
AI Analysis Loading
Checking Case
Checker Rejected
Signing Case
Execution Case
Execution Blocked
Done Case
Escalation Required

Policy Found
Policy Partial
No Policy
Policy Conflict
Verifier Warning
Verifier Failure → Escalation
Technical Retry Exhausted → Escalation
Re-analysis Limit Reached → Escalation
```

Mock response tidak boleh memiliki shape berbeda dari backend contract.

---

# 63. Demo Personas

Frontend development menggunakan four distinct workflow personas:

```text
Operations User
Risk User
Development User
Manager User
```

System roles:

```text
Operations User  → USER
Risk User        → USER
Development User → USER
Manager User     → ADMIN
```

Assignment demo:

```text
Operations User  → MAKER / OWNER
Risk User        → CHECKER
Manager User     → SIGNER
Development User → EXECUTER
```

ADMIN system role on Manager User does not provide extra case-action authority beyond its assigned SIGNER role.

---

# 64. Demo Case

Synthetic case:

```text
Case Type:
SETTLEMENT_EXCEPTION

Title:
Settlement reconciliation mismatch

Facts:
- 37 unmatched transactions
- settlement cutoff in 90 minutes
- 8 transactions missing approval evidence
- downstream process is waiting
```

FE mock/demo harus dapat menjalankan case ini sepanjang full workflow.

---

# 65. Responsive Behavior

MVP target utama:

```text
Desktop
Laptop
```

Minimum supported layout:

```text
1024px width
```

Tablet/mobile tetap usable untuk reading, tetapi workflow action utama dioptimalkan untuk desktop.

---

# 66. Accessibility

Minimum requirements:

- semantic button;
- form label;
- keyboard focus visible;
- dialog focus trap;
- status tidak disampaikan hanya melalui warna;
- error message terhubung ke input;
- table dapat dibaca oleh screen reader secara dasar.

---

# 67. Security

Frontend:

- tidak menyimpan service account credential;
- tidak menyimpan Vertex AI credential;
- tidak memiliki direct database access;
- tidak memiliki Cloud SQL credential;
- tidak memanggil Vertex AI atau RabbitMQ secara langsung;
- Firebase config public client hanya menggunakan browser-safe configuration;
- Firebase ID Token dikirim hanya ke Sentinel backend;
- evidence file upload hanya melalui signed URL dari backend.

---

# 68. Environment Variables

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Frontend tidak memiliki backend secret environment variable.

---

# 69. Local Development

Requirements:

```text
Node.js
npm
Firebase project configuration
Sentinel Backend or Mock API
```

Clone:

```bash
git clone <repository-url>
cd jawir-sentinel-fe
```

Environment:

```bash
cp .env.example .env.local
```

Install:

```bash
npm install
```

Run:

```bash
npm run dev
```

Application:

```text
http://localhost:3000
```

---

# 70. Scripts

```bash
npm run dev
npm run build
npm run start

npm run lint
npm run typecheck
npm run test
```

---

# 71. Testing

## Unit Test

Required for:

```text
formatters
mappers
schemas
permission presentation helpers
status helpers
API error normalization
```

---

## Component Test

Required for critical components:

```text
CaseActions
CheckerDecisionDialog
SignerDecisionDialog
ExecutionResultDialog
AnalysisView
PolicyReference
HistoryTimeline
```

---

## Integration Test

Critical frontend flow:

```text
Login
Create Case
Assign Participant
Submit
View Analysis
Checker Approve
Checker Reject
Signer Approve
Signer Reject
Execution Success
Execution Blocked
Execution Failed
Stale Analysis Handling
```

---

# 72. Frontend Error Scenarios

Must support:

```text
Network Offline
Backend 500
Unauthorized
Forbidden
Not Found
Invalid State Transition
Stale Analysis
AI Analysis Failed
Escalation Required
File Upload Failed
```

No critical page should collapse into an unhandled exception.

---

# 73. Deployment

Frontend repository memiliki deployment pipeline sendiri.

```text
GitHub
  ↓
GitHub Actions
  ↓
Lint
  ↓
Typecheck
  ↓
Test
  ↓
Next.js Build
  ↓
Docker Build
  ↓
Cloud Run Deploy
```

Service:

```text
sentinel-web
```

Runtime:

```text
Google Cloud Run
```

Backend:

```text
sentinel-api
```

---

# 74. Environment

```text
DEV
PROD
```

DEV digunakan untuk development dan integration.

PROD digunakan untuk competition demo/submission.

---

# 75. Frontend Definition of Done

Frontend MVP dianggap selesai ketika user dapat menjalankan full workflow berikut melalui UI:

```text
Login
↓
Maker creates case
↓
Maker assigns participants
↓
Maker submits case
↓
AI Analysis v1 appears
↓
Checker reviews and rejects
↓
AI Analysis v2 appears
↓
All Checkers approve
↓
Signer reviews and approves
↓
Executer starts execution
↓
Executer marks BLOCKED
↓
AI Analysis v3 appears
↓
All Checkers approve
↓
Signer approves
↓
Executer marks SUCCESS
↓
Case displays DONE
```

Seluruh flow harus menampilkan:

- current case status;
- current reviewable AI analysis when available;
- latest analysis attempt, including FAILED attempts;
- historical analysis versions;
- policy references;
- evidence;
- Checker decisions;
- Signer decision;
- execution result;
- audit timeline.

---

# 76. Documentation Contract

Product specification, workflow, state machine, ERD, dan API contract utama berada di:

```text
jawir-sentinel-docs
```

Frontend implementation mengikuti:

```text
jawir-sentinel-docs/api/api-contract.md
```

Backend implementation berada di:

```text
jawir-sentinel-be
```

Frontend tidak membuat contract API sendiri yang berbeda dari docs.

Perubahan terhadap API contract harus diperbarui pada docs sebelum frontend baseline berikutnya dibuat.
