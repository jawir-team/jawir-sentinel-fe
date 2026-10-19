# INT-004 Competition Demo Rehearsal

This runbook rehearses the locked JAWIR Sentinel workflow without a live
backend. It uses only synthetic browser-session mocks; it does not require or
permit manual database or RabbitMQ changes.

## Clean start

1. Copy `.env.example` to `.env.local` if needed and set:

   ```env
   NEXT_PUBLIC_ENABLE_API_MOCKS=true
   NEXT_PUBLIC_ENABLE_MOCK_AUTH=true
   ```

2. Keep the backend stopped and run `npm run dev`.
3. Open `/login`. A hard browser refresh or dev-server restart resets synthetic
   workflow state. During a rehearsal, switch personas with **Sign Out** and do
   not hard-refresh unless intentionally restarting from the seed.
4. Use password `sentinel123` if entering a persona email manually.

The four workflow identities are deliberately distinct:

| Persona button | Email | System role | Demo workflow role |
|---|---|---|---|
| Maker (Ops) | `ops@jawir.local` | USER | Maker/owner |
| Checker (Risk) | `risk@jawir.local` | USER | Checker |
| Signer (Manager) | `manager@jawir.local` | ADMIN | Signer |
| Executer (Development) | `dev@jawir.local` | USER | Executer |

`ADMIN` is independent of workflow authority. The Manager can administer
policies, but can approve a case only when assigned as its Signer.

## Rehearsal A: system-role and policy governance

1. Sign in as **Maker (Ops)**. Confirm the sidebar shows Dashboard, Cases, and
   Policies, but not Users, Units, or Case Types. Policies are readable by an
   authenticated user; create/version/activate controls are absent.
2. Sign out and sign in as **Signer (Manager)**. Confirm the `ADMIN` badge and
   the Administration navigation group (Users, Units, Case Types).
3. Open **Policies**. The table must show the authoritative active version and
   `INDEX: READY` separately.
4. For a mutation rehearsal, click **Add Policy**, enter unique metadata, and
   save. On its detail page click **Create New Version**, enter version/content,
   use an effective-from time at or before now, and save.
5. Click **Activate & Index**. Expected result: the version becomes
   `AUTHORITATIVE ACTIVE` with `INDEX: READY`; the policy list reflects that
   authoritative version after navigation back.
6. Open the seeded credit policy/case example as desired. A future-effective or
   expired DRAFT version must show its validity warning and keep activation
   disabled.

## Rehearsal B: analysis presentation and provenance

1. As any participant of `CASE-2026-000001`, open **Cases** → **Settlement
   reconciliation mismatch** → **AI Analysis**.
2. Expected result: version 1 is `CURRENT`, `COMPLETED`, and `VERIFIED: PASS`.
   Open the policy citation to show policy code, version, section, and excerpt.
   Open both evidence citations to show the seeded PDF and PNG/image grounding.
3. Open `CASE-2026-000002` as the Manager and inspect **AI Analysis**. Expected
   result: `PASS_WITH_WARNING` is prominent; verification findings remain
   visible; `POLICY_CONFLICT` is explained as a semantic AI result, not an HTTP
   409 or an automatic workflow transition.
4. Open `CASE-2026-000006` → **AI Analysis**. Expected result: v1 remains
   `CURRENT`; the newer v2 is `LATEST ATTEMPT`, `FAILED`, and verifier `FAIL`.
   Select v2 to inspect the failure without hiding v1. The escalation notice is
   a stopped success-with-escalation presentation: there is no resume, retry,
   or direct re-analysis CTA. **Audit History** shows `VERIFIER_FAIL`.

## Rehearsal C: full governed workflow

Start from the clean seeded draft `CASE-2026-000003`.

### 1. Maker prepares and freezes governance

1. Sign in as **Maker (Ops)** and open `CASE-2026-000003`.
2. Confirm status `DRAFT`, and that Maker and Owner are both Operations User.
3. In **Workflow Participant Assignments**, assign:
   - Risk User → required Checker
   - Manager User → Signer
   - Development User → Executer
4. Expected result: an already assigned user disappears from subsequent role
   selectors. The readiness panel shows exactly one Maker, at least one required
   Checker, exactly one Signer, exactly one Executer, and distinct users.
5. In **Evidence**, upload one PDF and one JPG/PNG through the signed-URL flow.
   The visible source is derived as `MAKER`; the client never asks for an actor
   role.
6. Return to **Overview**, click **Submit Case**, read the freeze warning, and
   confirm. Expected result: status becomes `AI_ANALYSIS`; case fields and
   participant assignment show read-only/frozen state.
7. The **AI Analysis** tab must show persisted attempt v1 as `GENERATING` with a
   queued/processing presentation. The browser has no broker controls or broker
   status. After the next poll (normally about three seconds), the case becomes
   `CHECKING`, v1 becomes `COMPLETED`, and v1 is `CURRENT`.

### 2. Checker rejection causes governed re-analysis

1. Sign out and sign in as **Checker (Risk)**. Reopen case 003 and inspect the
   current analysis before acting.
2. Open **Reviews & Approvals**, click **Reject Analysis**, enter a non-empty
   reason, and confirm.
3. Expected result: the business action succeeds and case status becomes
   `AI_ANALYSIS`. In **AI Analysis**, v1 remains `CURRENT` while v2 is
   `GENERATING` and labeled `LATEST ATTEMPT`.
4. Optional close-safety check while v2 is generating: click **Close Case**,
   enter a reason, and confirm. Expected result: `409
   INVALID_STATE_TRANSITION` is presented as “wait for GENERATING/IN_PROGRESS to
   finish”; no state is changed and no process is cancelled.
5. Wait for polling. Expected result: v2 becomes `COMPLETED` and `CURRENT`, and
   the case returns to `CHECKING` with a new pending Checker round.
6. In **Reviews & Approvals**, approve v2. Expected result: case status becomes
   `SIGNING`; Risk can no longer submit another Checker decision.

### 3. Signer authorization

1. Sign out and sign in as **Signer (Manager)**.
2. Reopen case 003. Confirm the Manager has ADMIN navigation but the case action
   is shown because Manager is the assigned Signer—not because of ADMIN.
3. Inspect the current analysis and Checker quorum, then choose **Authorize Case
   (Signer Approve)**.
4. Expected result: case status becomes `EXECUTION`; Signer actions disappear
   and the assigned Executer is named.

### 4. Execution blocker causes another governed re-analysis

1. Sign out and sign in as **Executer (Development)**.
2. Open case 003 → **Execution** → **Start Execution**. Expected result:
   `IN_PROGRESS` is visible and a second start is unavailable.
3. Choose **Report Blocked**, enter `action_taken` and `blocker`, then confirm.
4. Expected result: the BLOCKED execution attempt remains in history, case
   status becomes `AI_ANALYSIS`, v2 remains `CURRENT`, and v3 appears as
   `GENERATING` / `LATEST ATTEMPT`.
5. Wait for v3 to complete. Expected result: v3 becomes `CURRENT` and the case
   returns to `CHECKING` with a fresh Checker round.

### 5. Final approval and successful execution

1. As **Checker (Risk)**, inspect and approve v3 → expected `SIGNING`.
2. As **Signer (Manager)**, authorize v3 → expected `EXECUTION`.
3. As **Executer (Development)**, start the new execution, choose **Report
   Success**, enter `action_taken` and `result`, and confirm.
4. Expected result: case status is `DONE`; all mutation controls are absent and
   the case is visibly read-only.
5. Open **Audit History**, switch oldest/newest ordering, and verify the visible
   chain: participant assignments, evidence, submit, analysis starts/completions,
   Checker reject/approvals, Signer approvals, execution BLOCKED, second
   re-analysis, execution SUCCESS. Click an analysis-version chip to jump to its
   read-only attempt.

## Concurrency and recovery notes

- `STALE_ANALYSIS`: the decision is not applied or retried. Use **Reload &
  Review Latest Analysis**; the UI refetches case, attempt list, current analysis,
  Checker round, history, execution state, and dashboard before another action.
- Delayed analysis: remain on the Analysis tab for at least one polling interval.
  `AI_ANALYSIS` plus `GENERATING` is normal queued/processing state, not a reason
  to edit RabbitMQ or the database.
- Close rejected by an active process: wait for analysis/execution to reach a
  terminal result, refetch, and then close if still appropriate. Close never
  cancels an AI job or execution.
- Wrong role or state: sign in as the assigned persona and refetch the case.
  ADMIN never overrides workflow role or state.
- `ESCALATION_REQUIRED`: treat the governed action that returned this state as
  successfully persisted. The only MVP follow-ups are participant evidence for
  investigation or Close Case; create a new case if work must continue.
- Full synthetic reset: hard-refresh or restart the dev server, then repeat from
  the clean seed. Do not refresh in the middle of a stateful rehearsal.

## Known non-blocking limitations / contract questions

1. The locked API contract has no read endpoint for execution attempts, while
   the frontend needs authoritative `IN_PROGRESS` state and historical attempts
   after navigation/persona handoff. Existing code calls
   `GET /cases/{case_id}/executions`; the contract documents only the two POST
   execution mutations. The docs repository was not changed. Backend/docs owners
   must either lock this GET response shape or define another authoritative read
   model before real-backend integration.
2. The locked contract defines policy list, create, version create, single
   version read, and activation, but no policy-detail or version-list endpoint.
   Existing policy detail UI calls `GET /policies/{policy_id}` and expects policy
   metadata plus `versions[]`; `POST /policies` also has no documented response
   body even though the UI needs the new policy ID. This requires a docs-first
   contract decision; no workaround or docs-repo edit was made here.
3. Offline analysis/indexing timing and content are synthetic. Mock policy
   activation completes indexing immediately, and generated analysis does not
   invoke Gemini or dynamically interpret uploaded bytes. Infrastructure-failure
   recovery remains an optional, separate backend rehearsal.
4. Mock workflow state is browser-session memory so persona handoffs work in one
   rehearsal, but a hard refresh intentionally restores the clean seed. This is
   not persistence behavior expected from the real backend.
