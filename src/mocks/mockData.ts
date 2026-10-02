import { Unit } from "@/types/unit";
import { CaseType } from "@/types/caseType";
import { UserItem } from "@/types/user";

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
