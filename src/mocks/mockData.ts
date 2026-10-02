import { Unit } from "@/types/unit";
import { CaseType } from "@/types/caseType";
import { UserItem } from "@/types/user";
import { CaseDetail } from "@/types/case";

export const initialUnits: Unit[] = [
  {
    id: "unit-ops",
    code: "OPS",
    name: "Financial Operations",
    description: "Financial settlement and operational processing unit",
  },
  {
    id: "unit-risk",
    code: "RISK",
    name: "Risk Management",
    description: "Operational, credit, and compliance risk unit",
  },
  {
    id: "unit-mgmt",
    code: "MGMT",
    name: "Executive Management",
    description: "Authorizing signers and department executives",
  },
  {
    id: "unit-it",
    code: "IT",
    name: "Information Technology",
    description: "Engineering and technology infrastructure unit",
  },
];

export const initialCaseTypes: CaseType[] = [
  {
    id: "ct-settlement",
    code: "SETTLEMENT_EXCEPTION",
    name: "Settlement Exception",
    description: "Settlement or reconciliation related operational exception",
  },
  {
    id: "ct-credit",
    code: "CREDIT_OVERRIDE",
    name: "Credit Limit Override",
    description: "Single customer exposure limit override exception",
  },
  {
    id: "ct-compliance",
    code: "AML_TRANSACTION_FLAG",
    name: "AML Transaction Flag",
    description: "Compliance exception flagged during settlement monitoring",
  },
];

export const initialUsers: UserItem[] = [
  {
    id: "usr-ops",
    name: "Operations User",
    email: "ops@jawir.local",
    status: "ACTIVE",
    system_role: "USER",
    unit: { id: "unit-ops", code: "OPS", name: "Financial Operations" },
  },
  {
    id: "usr-risk",
    name: "Risk User",
    email: "risk@jawir.local",
    status: "ACTIVE",
    system_role: "USER",
    unit: { id: "unit-risk", code: "RISK", name: "Risk Management" },
  },
  {
    id: "usr-dev",
    name: "Development User",
    email: "dev@jawir.local",
    status: "ACTIVE",
    system_role: "USER",
    unit: { id: "unit-it", code: "IT", name: "Information Technology" },
  },
  {
    id: "usr-manager",
    name: "Manager User",
    email: "manager@jawir.local",
    status: "ACTIVE",
    system_role: "USER",
    unit: { id: "unit-mgmt", code: "MGMT", name: "Executive Management" },
  },
  {
    id: "usr-admin",
    name: "System Administrator",
    email: "admin@jawir.local",
    status: "ACTIVE",
    system_role: "ADMIN",
    unit: { id: "unit-ops", code: "OPS", name: "Financial Operations" },
  },
];

export const initialCases: CaseDetail[] = [
  {
    id: "case-001",
    case_number: "CASE-2026-000001",
    title: "Settlement reconciliation mismatch",
    description: "37 transactions failed reconciliation. Settlement cutoff in 90 minutes. Downstream clearing is waiting.",
    urgency: "HIGH" as const,
    status: "CHECKING" as const,
    case_type: {
      id: "ct-settlement",
      code: "SETTLEMENT_EXCEPTION",
      name: "Settlement Exception",
    },
    maker: { id: "usr-ops", name: "Operations User" },
    owner: { id: "usr-ops", name: "Operations User" },
    participants: [
      {
        id: "part-1",
        user_id: "usr-ops",
        name: "Operations User",
        role: "MAKER" as const,
        required: true,
        status: "ACTIVE" as const,
      },
      {
        id: "part-2",
        user_id: "usr-risk",
        name: "Risk User",
        role: "CHECKER" as const,
        required: true,
        status: "ACTIVE" as const,
      },
      {
        id: "part-3",
        user_id: "usr-dev",
        name: "Development User",
        role: "CHECKER" as const,
        required: true,
        status: "ACTIVE" as const,
      },
      {
        id: "part-4",
        user_id: "usr-manager",
        name: "Manager User",
        role: "SIGNER" as const,
        required: true,
        status: "ACTIVE" as const,
      },
      {
        id: "part-5",
        user_id: "usr-ops",
        name: "Operations User",
        role: "EXECUTER" as const,
        required: true,
        status: "ACTIVE" as const,
      },
    ],
    current_analysis: {
      id: "analysis-v1",
      version: 1,
      verification_status: "PASS" as const,
    },
    created_at: "2026-10-01T10:00:00Z",
    updated_at: "2026-10-01T10:05:00Z",
  },
  {
    id: "case-002",
    case_number: "CASE-2026-000002",
    title: "High-value intraday credit line override",
    description: "Request for intraday liquidity credit buffer expansion beyond standard parameters.",
    urgency: "CRITICAL" as const,
    status: "SIGNING" as const,
    case_type: {
      id: "ct-credit",
      code: "CREDIT_OVERRIDE",
      name: "Credit Limit Override",
    },
    maker: { id: "usr-ops", name: "Operations User" },
    owner: { id: "usr-ops", name: "Operations User" },
    participants: [
      {
        id: "part-201",
        user_id: "usr-ops",
        name: "Operations User",
        role: "MAKER" as const,
        required: true,
        status: "ACTIVE" as const,
      },
      {
        id: "part-202",
        user_id: "usr-risk",
        name: "Risk User",
        role: "CHECKER" as const,
        required: true,
        status: "ACTIVE" as const,
      },
      {
        id: "part-203",
        user_id: "usr-manager",
        name: "Manager User",
        role: "SIGNER" as const,
        required: true,
        status: "ACTIVE" as const,
      },
    ],
    current_analysis: {
      id: "analysis-v2",
      version: 2,
      verification_status: "PASS" as const,
    },
    created_at: "2026-10-01T11:00:00Z",
    updated_at: "2026-10-01T11:30:00Z",
  },
  {
    id: "case-003",
    case_number: "CASE-2026-000003",
    title: "Draft exception for batch settlement",
    description: "Initial draft awaiting evidence and participant assignment.",
    urgency: "MEDIUM" as const,
    status: "DRAFT" as const,
    case_type: {
      id: "ct-settlement",
      code: "SETTLEMENT_EXCEPTION",
      name: "Settlement Exception",
    },
    maker: { id: "usr-ops", name: "Operations User" },
    owner: { id: "usr-ops", name: "Operations User" },
    participants: [
      {
        id: "part-301",
        user_id: "usr-ops",
        name: "Operations User",
        role: "MAKER" as const,
        required: true,
        status: "ACTIVE" as const,
      },
    ],
    current_analysis: null,
    created_at: "2026-10-01T12:00:00Z",
    updated_at: "2026-10-01T12:00:00Z",
  },
];

