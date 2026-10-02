import { apiGet, apiPost } from "./client";
import { CaseType, CreateCaseTypePayload } from "@/types/caseType";
import { initialCaseTypes } from "@/mocks/mockData";

let mockCaseTypes = [...initialCaseTypes];

export async function getCaseTypes(): Promise<CaseType[]> {
  try {
    return await apiGet<CaseType[]>("/case-types");
  } catch (err: unknown) {
    if (err && typeof err === "object" && "status" in err && (err as { status?: number }).status === 401) {
      throw err;
    }
    return [...mockCaseTypes];
  }
}

export async function createCaseType(
  payload: CreateCaseTypePayload
): Promise<CaseType> {
  try {
    return await apiPost<CaseType, CreateCaseTypePayload>("/case-types", payload);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "status" in err && (err as { status?: number }).status === 401) {
      throw err;
    }
    const newCaseType: CaseType = {
      id: `ct-${Date.now()}`,
      code: payload.code.toUpperCase(),
      name: payload.name,
      description: payload.description,
    };
    mockCaseTypes.push(newCaseType);
    return newCaseType;
  }
}
