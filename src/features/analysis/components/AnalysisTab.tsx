"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { CaseDetail } from "@/types/case";
import { getCurrentAnalysis } from "@/services/api/analyses";
import { queryKeys } from "@/constants/queryKeys";
import { AnalysisDetailView } from "./AnalysisDetailView";
import { LoadingState } from "@/components/feedback/LoadingState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Sparkles, Clock, AlertTriangle } from "lucide-react";

interface AnalysisTabProps {
  caseData: CaseDetail;
}

export function AnalysisTab({ caseData }: AnalysisTabProps) {
  const isDraft = caseData.status === "DRAFT";
  const isAiAnalysisRunning = caseData.status === "AI_ANALYSIS";

  const {
    data: currentAnalysis,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.analysisCurrent(caseData.id),
    queryFn: () => getCurrentAnalysis(caseData.id),
    enabled: !isDraft,
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

  if (isError || !currentAnalysis) {
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
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <AnalysisDetailView analysis={currentAnalysis} isCurrent={true} />
    </div>
  );
}
