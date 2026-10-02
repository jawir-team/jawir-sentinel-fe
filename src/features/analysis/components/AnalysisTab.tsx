"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
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
import { LoadingState } from "@/components/feedback/LoadingState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Sparkles, Clock, AlertTriangle, Info } from "lucide-react";

interface AnalysisTabProps {
  caseData: CaseDetail;
}

export function AnalysisTab({ caseData }: AnalysisTabProps) {
  const isDraft = caseData.status === "DRAFT";
  const isAiAnalysisRunning = caseData.status === "AI_ANALYSIS";

  // Fetch all persisted analysis attempts
  const {
    data: analyses = [],
    isLoading: isLoadingList,
    refetch: refetchList,
  } = useQuery({
    queryKey: queryKeys.analyses(caseData.id),
    queryFn: () => getAnalyses(caseData.id),
    enabled: !isDraft,
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
        // Default to latest attempt if no current analysis
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
    retry: isAiAnalysisRunning ? 5 : 1,
  });

  if (isDraft) {
    return (
      <EmptyState
        icon={<Sparkles className="h-8 w-8 text-slate-400" />}
        title="Analisis AI Belum Dijalankan"
        description="Analisis AI Sentinel akan dieksekusi secara otomatis saat Maker menyelesaikan pengisian draf dan mengajukan case."
      />
    );
  }

  const isLoading = (isLoadingList || isLoadingDetail) && !activeAnalysis;

  if (isLoading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center space-y-3">
        <LoadingState
          label={
            isAiAnalysisRunning
              ? "Sedang menjalankan analisis inferensi AI Sentinel... Mengumpulkan bukti & mengevaluasi klausul kebijakan."
              : "Memuat data analisis AI..."
          }
        />
        {isAiAnalysisRunning && (
          <p className="text-xs text-slate-500 flex items-center gap-1.5 animate-pulse">
            <Clock className="h-3.5 w-3.5" />
            <span>Memeriksa hasil verifikasi model secara berkala...</span>
          </p>
        )}
      </div>
    );
  }

  if (isErrorDetail || !activeAnalysis) {
    // If case is AI_ANALYSIS but not yet ready, show generating status
    if (isAiAnalysisRunning) {
      return (
        <div className="p-8 text-center space-y-4 bg-blue-50/50 border border-blue-200 rounded-lg">
          <div className="inline-flex p-3 rounded-full bg-blue-100 text-blue-700 animate-pulse">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 text-sm">
              Analisis Sedang Berlangsung
            </h4>
            <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
              Sistem AI Sentinel sedang memverifikasi bukti dokumen dan mengevaluasi kepatuhan SOP perbankan. Hasil analisis reviewable akan muncul setelah lolos verifikasi.
            </p>
          </div>
        </div>
      );
    }

    return (
      <ErrorState
        title="Analisis Tidak Ditemukan"
        message="Tidak dapat memuat hasil analisis untuk case ini. Mungkin belum ada analisis yang berstatus PASS atau terjadi kendala jaringan."
        onRetry={() => {
          refetchList();
          refetchDetail();
        }}
      />
    );
  }

  const isCurrent = activeAnalysis.id === currentAnalysisId;

  return (
    <div className="space-y-6">
      {/* Version Selector for multiple attempts */}
      {analyses.length > 0 && (
        <AnalysisVersionSelector
          analyses={analyses}
          currentAnalysisId={currentAnalysisId}
          selectedAnalysisId={activeAnalysis.id}
          onSelectAnalysis={(id) => setSelectedId(id)}
        />
      )}

      {/* Historical or non-current notice banner */}
      {!isCurrent && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3 text-xs text-amber-900">
          <Info className="h-4 w-4 text-amber-600 shrink-0" />
          <p>
            <span className="font-semibold">Mode Peninjauan Riwayat:</span> Anda
            sedang melihat Analisis <strong>Versi #{activeAnalysis.version}</strong> (
            {activeAnalysis.status}). Versi historis/percobaan bersifat read-only.
            Persetujuan Checker dan Signer hanya berlaku untuk versi{" "}
            <strong>CURRENT</strong>.
          </p>
        </div>
      )}

      {/* Main Analysis Detail View with provenance handlers */}
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
