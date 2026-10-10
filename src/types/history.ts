export interface HistoryActor {
  id: string;
  name: string;
}

export interface CaseHistoryEvent {
  id: string;
  event_type: string;
  actor?: HistoryActor | null;
  actor_role?: string | null;
  analysis_id?: string | null;
  analysis_version?: number | null;
  metadata?: Record<string, unknown>;
  created_at: string;
}
