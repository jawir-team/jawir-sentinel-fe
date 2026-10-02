export interface CaseType {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export interface CreateCaseTypePayload {
  code: string;
  name: string;
  description?: string;
}
