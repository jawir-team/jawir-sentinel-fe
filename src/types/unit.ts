export interface Unit {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export interface CreateUnitPayload {
  code: string;
  name: string;
  description?: string;
}
