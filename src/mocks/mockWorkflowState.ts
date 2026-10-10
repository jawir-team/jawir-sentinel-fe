const activeAnalysisCases = new Set<string>();
const activeExecutionCases = new Set<string>();
let analysisStarter: ((caseId: string) => void) | null = null;

export function registerMockAnalysisStarter(
  starter: (caseId: string) => void
): void {
  analysisStarter = starter;
}

export function startMockAnalysisProcess(caseId: string): void {
  activeAnalysisCases.add(caseId);
  analysisStarter?.(caseId);
}

export function setMockAnalysisActive(caseId: string, active: boolean): void {
  if (active) activeAnalysisCases.add(caseId);
  else activeAnalysisCases.delete(caseId);
}

export function setMockExecutionActive(caseId: string, active: boolean): void {
  if (active) activeExecutionCases.add(caseId);
  else activeExecutionCases.delete(caseId);
}

export function hasMockActiveProcess(caseId: string): boolean {
  return activeAnalysisCases.has(caseId) || activeExecutionCases.has(caseId);
}
