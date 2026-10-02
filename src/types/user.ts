export type SystemRole = "USER" | "ADMIN";

export interface UnitSummary {
  id: string;
  code: string;
  name: string;
}

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  system_role: SystemRole;
  unit: UnitSummary;
}

export interface UserItem {
  id: string;
  name: string;
  email: string;
  system_role: SystemRole;
  is_active: boolean;
  unit: UnitSummary;
  created_at?: string;
  updated_at?: string;
}
