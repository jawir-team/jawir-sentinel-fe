"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CaseDetail } from "@/types/case";
import { PolicyReference } from "@/types/analysis";
import {
  getAnalyses,
  getCurrentAnalysis,
  getAnalysisById,
} from "@/services/api/analyses";
import { getEvidences } from "@/services/api/evidences";
import { queryKeys } from "@/constants/queryKeys";
import { AnalysisDetailView } from "./AnalysisDetailView";
import { AnalysisVersionSelector } from "./AnalysisVersionSelector";
import { ReferenceViewerDialog } from "./ReferenceViewerDialog";
import { EscalationNotice, EscalationCause } from "./EscalationNotice";
import { LoadingState } from "@/components/feedback/LoadingState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Sparkles, Clock, AlertTriangle, Info, RefreshCw, ShieldAlert } from "lucide-react";

interface AnalysisTabProps {
  caseData: CaseDetail;
}

export function AnalysisTab({ caseData }: AnalysisTabProps) {
  const queryClient = useQueryClient();
  const isDraft = caseData.status === "DRAFT";
  const isAiAnalysisRunning = caseData.status === "AI_ANALYSIS";
  const isEscalationRequired = caseData.status === "ESCALATION_REQUIRED";

  // Polling interval: 3000ms while AI_ANALYSIS is running; false otherwise
  const pollInterval = isAiAnalysisRunning ? 3000 : false;

  // Fetch all persisted analysis attempts with polling support
  const {
    data: analyses = [],
    isLoading: isLoadingList,
    refetch: refetchList,
  } = useQuery({
    queryKey: queryKeys.analyses(caseData.id),
    queryFn: () => getAnalyses(caseData.id),
    enabled: !isDraft,
    refetchInterval: pollInterval,
  });

  // Fetch evidences to resolve provenance metadata
  const { data: allEvidences = [] } = useQuery({
    queryKey: queryKeys.evidences(caseData.id),
    queryFn: () => getEvidences(caseData.id),
    enabled: !isDraft,
  });

  const currentAnalysisId = caseData.current_analysis?.id;

  // Selected analysis ID state
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  // Provenance viewer modal state
  const [viewingPolicyRef, setViewingPolicyRef] =
    React.useState<PolicyReference | null>(null);
  const [viewingEvidence, setViewingEvidence] = React.useState<{
    id: string;
    usageType?: string;
  } | null>(null);

  // Initialize selectedId once list or current analysis is known
  React.useEffect(() => {
    if (!selectedId) {
      if (currentAnalysisId) {
        setSelectedId(currentAnalysisId);
      } else if (analyses && analyses.length > 0) {
        const sorted = [...analyses].sort((a, b) => b.version - a.version);
        setSelectedId(sorted[0].id);
      }
    }
  }, [currentAnalysisId, analyses, selectedId]);

  // Fetch the active analysis details (either current or selected historical)
  const activeAnalysisId = selectedId || currentAnalysisId;

  const {
    data: activeAnalysis,
    isLoading: isLoadingDetail,
    isError: isErrorDetail,
    refetch: refetchDetail,
  } = useQuery({
    queryKey: activeAnalysisId
      ? queryKeys.analysis(caseData.id, activeAnalysisId)
      : queryKeys.analysisCurrent(caseData.id),
    queryFn: () => {
      if (activeAnalysisId) {
        return getAnalysisById(caseData.id, activeAnalysisId);
      }
      return getCurrentAnalysis(caseData.id);
    },
    enabled: !isDraft && Boolean(activeAnalysisId || isAiAnalysisRunning),
    refetchInterval: pollInterval,
    retry: isAiAnalysisRunning ? 10 : 1,
  });

  // When polling discovers completed analysis, refresh case root query to transition out of AI_ANALYSIS
  React.useEffect(() => {
    if (isAiAnalysisRunning && analyses.some((a) => a.status === "COMPLETED")) {
      queryClient.invalidateQueries({ queryKey: queryKeys.case(caseData.id) });
    }
  }, [isAiAnalysisRunning, analyses, caseData.id, queryClient]);

  if (isDraft) {
    return (
      <EmptyState
        icon={<Sparkles className="h-8 w-8 text-slate-400" />}
        title="AI Analysis Not Started"
        description="Sentinel AI analysis will run automatically once the Maker finishes drafting and submits the case."
      />
    );
  }

  // Active generating state during initial AI_ANALYSIS when no analysis is available yet
  if (isAiAnalysisRunning && !activeAnalysis) {
    return (
      <div className="py-12 px-6 max-w-2xl mx-auto text-center space-y-6">
        <div className="inline-flex p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 shadow-sm animate-pulse">
          <Sparkles className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-slate-900">
            Sentinel AI Analysis in Progress
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Sentinel AI is extracting facts from case evidence, performing semantic search against policy clauses, and verifying action recommendations.
          </p>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-left space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-600" />
            <span>Inference & Verification Cycle Status:</span>
          </div>
          <ul className="text-xs text-slate-600 space-y-1.5 pl-5 list-disc">
            <li>Validating documentary evidence uploaded by Maker...</li>
            <li>Matching relevant SOP / Policy clauses...</li>
            <li>Running anti-hallucination verification and factual consistency checks...</li>
          </ul>
        </div>

        <p className="text-xs text-slate-400 font-mono">
          This page will update automatically once verification results are published.
        </p>
      </div>
    );
  }

  const isLoading = (isLoadingList || isLoadingDetail) && !activeAnalysis;

  if (isLoading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center space-y-3">
        <LoadingState label="Loading AI analysis data..." />
      </div>
    );
  }

  // Determine escalation cause if case or analysis indicates failure/escalation
  const latestAttempt = analyses && analyses.length > 0
    ? [...analyses].sort((a, b) => b.version - a.version)[0]
    : null;

  let escalationCause: EscalationCause = "UNKNOWN";
  if (latestAttempt?.verification_status === "FAIL") {
    escalationCause = "VERIFIER_FAIL";
  } else if (analyses.length >= 4) {
    escalationCause = "REANALYSIS_LIMIT_REACHED";
  } else if (activeAnalysis?.failure_reason?.toLowerCase().includes("timeout") ||
             activeAnalysis?.failure_reason?.toLowerCase().includes("retry")) {
    escalationCause = "TECHNICAL_RETRY_EXHAUSTED";
  } else if (activeAnalysis?.status === "FAILED") {
    escalationCause = "VERIFIER_FAIL";
  }

  if (isErrorDetail && !activeAnalysis) {
    if (isEscalationRequired) {
      return (
        <div className="space-y-6">
          <EscalationNotice
            cause={escalationCause}
            versionCount={analyses.length}
          />
          {analyses.length > 0 && (
            <AnalysisVersionSelector
              analyses={analyses}
              currentAnalysisId={currentAnalysisId}
              selectedAnalysisId={analyses[0].id}
              onSelectAnalysis={(id) => setSelectedId(id)}
            />
          )}
        </div>
      );
    }

    return (
      <ErrorState
        title="Analysis Not Found"
        message="Unable to load analysis results for this case. An analysis with PASS status may not be available yet, or a network issue occurred."
        onRetry={() => {
          refetchList();
          refetchDetail();
        }}
      />
    );
  }

  const isCurrent = activeAnalysis ? activeAnalysis.id === currentAnalysisId : false;

  return (
    <div className="space-y-6">
      {/* Escalation notice if case requires escalation */}
      {isEscalationRequired && (
        <EscalationNotice
          cause={escalationCause}
          failureReason={activeAnalysis?.failure_reason}
          versionCount={analyses.length}
        />
      )}

      {/* Version Selector for multiple attempts */}
      {analyses.length > 0 && (
        <AnalysisVersionSelector
          analyses={analyses}
          currentAnalysisId={currentAnalysisId}
          selectedAnalysisId={activeAnalysis ? activeAnalysis.id : ""}
          onSelectAnalysis={(id) => setSelectedId(id)}
        />
      )}

      {/* Historical or non-current notice banner */}
      {activeAnalysis && !isCurrent && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3 text-xs text-amber-900">
          <Info className="h-4 w-4 text-amber-600 shrink-0" />
          <p>
            <span className="font-semibold">Historical Review Mode:</span> You
            are viewing Analysis <strong>Version #{activeAnalysis.version}</strong> (
            {activeAnalysis.status}). Historical and trial attempts are read-only.
            Checker and Signer approvals apply exclusively to the{" "}
            <strong>CURRENT</strong> version.
          </p>
        </div>
      )}

      {/* Main Analysis Detail View with provenance handlers */}
      {activeAnalysis && (
        <AnalysisDetailView
          analysis={activeAnalysis}
          isCurrent={isCurrent}
          onOpenPolicyRef={(ref) => setViewingPolicyRef(ref)}
          onOpenEvidenceRef={(evidenceId) => {
            const refItem = activeAnalysis.evidence_references?.find(
              (r) => r.evidence_id === evidenceId
            );
            setViewingEvidence({
              id: evidenceId,
              usageType: refItem?.usage_type,
            });
          }}
        />
      )}

      {/* Provenance Inspection Dialogs */}
      {viewingPolicyRef && (
        <ReferenceViewerDialog
          isOpen={Boolean(viewingPolicyRef)}
          onClose={() => setViewingPolicyRef(null)}
          policyRef={viewingPolicyRef}
        />
      )}

      {viewingEvidence && (
        <ReferenceViewerDialog
          isOpen={Boolean(viewingEvidence)}
          onClose={() => setViewingEvidence(null)}
          evidenceRefId={viewingEvidence.id}
          evidenceUsageType={viewingEvidence.usageType}
          allEvidences={allEvidences}
        />
      )}
    </div>
  );
}
