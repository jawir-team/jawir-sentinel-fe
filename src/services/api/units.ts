import { apiGet, apiPost } from "./client";
import { Unit, CreateUnitPayload } from "@/types/unit";
import { initialUnits } from "@/mocks/mockData";

let mockUnits = [...initialUnits];

export async function getUnits(): Promise<Unit[]> {
  try {
    return await apiGet<Unit[]>("/units");
  } catch (err: unknown) {
    if (err && typeof err === "object" && "status" in err && (err as { status?: number }).status === 401) {
      throw err;
    }
    return [...mockUnits];
  }
}

export async function createUnit(payload: CreateUnitPayload): Promise<Unit> {
  try {
    return await apiPost<Unit, CreateUnitPayload>("/units", payload);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "status" in err && (err as { status?: number }).status === 401) {
      throw err;
    }
    const newUnit: Unit = {
      id: `unit-${Date.now()}`,
      code: payload.code.toUpperCase(),
      name: payload.name,
      description: payload.description,
    };
    mockUnits.push(newUnit);
    return newUnit;
  }
}
