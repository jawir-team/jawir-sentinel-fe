# JAWIR Sentinel Frontend Implementation Progress

- [x] FE-001 Initialize Next.js project (#30) — App Router scaffold with TypeScript, ESLint, and Next.js 14 verified.
- [x] FE-002 Setup Tailwind + base UI primitives (#31) — Configured Tailwind and created accessible base UI primitives and feedback states.
- [x] FE-003 Setup TanStack Query + API client (#32) — Configured QueryClient provider, API client with auth injection, error envelope normalization, and query keys.
- [x] FE-004 App shell + routing (#33) — Implemented App shell (Header, Sidebar, Container), error/loading/not-found boundaries, and all core MVP routes.
- [x] FE-005 Firebase login flow (#34) — Implemented Firebase authentication service, session observer, token injection into API client, login page, and protected route layout.
- [x] FE-006 Current user/session handling (#35) — Integrated GET /me Sentinel identity, system_role (USER vs ADMIN) navigation visibility, and 401/403 session de-authorization.
- [x] FE-007 Unit/User/Case Type management UI (#36) — Implemented management UI and APIs for Units, Users, and Case Types with role guard and safety invariant checks.
- [x] FE-008 Case list (#37) — Implemented case list with status/urgency/casetype filters, pagination, accessible status badges, and detail navigation.
- [x] FE-009 Create/Edit Case (#38) — Implemented CaseForm with immutable Maker/Owner assignment, DRAFT editing, non-DRAFT submission freeze, and create case flow.
