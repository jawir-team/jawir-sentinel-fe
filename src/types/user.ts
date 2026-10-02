export type SystemRole = "USER" | "ADMIN";
export type UserStatus = "ACTIVE" | "INACTIVE";

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
  status: UserStatus;
  system_role: SystemRole;
  unit: UnitSummary;
}

export interface CreateUserPayload {
  firebase_uid?: string;
  name: string;
  email: string;
  unit_id: string;
  status: UserStatus;
  system_role: SystemRole;
}

export interface UpdateUserPayload {
  name?: string;
  unit_id?: string;
  status?: UserStatus;
  system_role?: SystemRole;
}
