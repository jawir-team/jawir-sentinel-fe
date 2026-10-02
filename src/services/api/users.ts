import { apiGet, apiPost, apiPatch } from "./client";
import { UserItem, CreateUserPayload, UpdateUserPayload } from "@/types/user";
import { initialUsers, initialUnits } from "@/mocks/mockData";
import { ApiError } from "@/types/api";

let mockUsers = [...initialUsers];

export async function getUsers(params?: {
  unit_id?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<UserItem[]> {
  try {
    const res = await apiGet<UserItem[] | { data: UserItem[] }>("/users", params);
    if (Array.isArray(res)) return res;
    if (res && "data" in res && Array.isArray(res.data)) return res.data;
    return [];
  } catch (err: unknown) {
    if (err && typeof err === "object" && "status" in err && (err as { status?: number }).status === 401) {
      throw err;
    }
    let list = [...mockUsers];
    if (params?.unit_id) {
      list = list.filter((u) => u.unit.id === params.unit_id);
    }
    if (params?.status) {
      list = list.filter((u) => u.status === params.status);
    }
    return list;
  }
}

export async function createUser(payload: CreateUserPayload): Promise<UserItem> {
  try {
    return await apiPost<UserItem, CreateUserPayload>("/users", payload);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "status" in err && (err as { status?: number }).status === 401) {
      throw err;
    }

    const unit =
      initialUnits.find((u) => u.id === payload.unit_id) || {
        id: payload.unit_id,
        code: "GEN",
        name: "General",
      };

    const newUser: UserItem = {
      id: `usr-${Date.now()}`,
      name: payload.name,
      email: payload.email,
      status: payload.status,
      system_role: payload.system_role,
      unit: {
        id: unit.id,
        code: unit.code,
        name: unit.name,
      },
    };

    mockUsers.push(newUser);
    return newUser;
  }
}

export async function updateUser(
  userId: string,
  payload: UpdateUserPayload
): Promise<UserItem> {
  try {
    return await apiPatch<UserItem, UpdateUserPayload>(`/users/${userId}`, payload);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "status" in err && (err as { status?: number }).status === 401) {
      throw err;
    }

    const index = mockUsers.findIndex((u) => u.id === userId);
    if (index === -1) {
      throw new ApiError("USER_NOT_FOUND", "Pengguna tidak ditemukan", 404);
    }

    const current = mockUsers[index];

    // Invariant guard 1: The system must always retain at least one ACTIVE ADMIN
    if (
      (payload.system_role === "USER" || payload.status === "INACTIVE") &&
      current.system_role === "ADMIN" &&
      current.status === "ACTIVE"
    ) {
      const activeAdminCount = mockUsers.filter(
        (u) => u.system_role === "ADMIN" && u.status === "ACTIVE"
      ).length;
      if (activeAdminCount <= 1) {
        throw new ApiError(
          "INVALID_STATE_TRANSITION",
          "Tidak dapat menurunkan role atau menonaktifkan ACTIVE ADMIN terakhir di sistem.",
          409,
          { reason: "LAST_ACTIVE_ADMIN" }
        );
      }
    }

    // Invariant guard 2: Deactivation while active participant in non-terminal case
    if (payload.status === "INACTIVE" && current.id === "usr-ops") {
      // Mock guard check for active cases
      throw new ApiError(
        "INVALID_STATE_TRANSITION",
        "Pengguna masih menjadi partisipan aktif pada case yang sedang berjalan.",
        409,
        { reason: "IN_FLIGHT_CASE_PARTICIPANT" }
      );
    }

    const updatedUnit = payload.unit_id
      ? initialUnits.find((u) => u.id === payload.unit_id) || current.unit
      : current.unit;

    const updated: UserItem = {
      ...current,
      name: payload.name !== undefined ? payload.name : current.name,
      status: payload.status !== undefined ? payload.status : current.status,
      system_role:
        payload.system_role !== undefined ? payload.system_role : current.system_role,
      unit: {
        id: updatedUnit.id,
        code: updatedUnit.code,
        name: updatedUnit.name,
      },
    };

    mockUsers[index] = updated;
    return updated;
  }
}
