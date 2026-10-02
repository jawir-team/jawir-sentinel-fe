"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ContentContainer } from "@/components/layout/ContentContainer";
import { LoadingState } from "@/components/feedback/LoadingState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { CaseDetailHeader } from "@/features/case/components/CaseDetailHeader";
import { CaseParticipantsCard } from "@/features/case/components/CaseParticipantsCard";
import { ParticipantAssignmentSection } from "@/features/case/components/ParticipantAssignmentSection";
import { SubmitCaseSection } from "@/features/case/components/SubmitCaseSection";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getCaseById } from "@/services/api/cases";
import { queryKeys } from "@/constants/queryKeys";
import { useAuth } from "@/features/auth/context/AuthContext";
import {
  FileText,
  Sparkles,
  Paperclip,
  CheckSquare,
  PlayCircle,
  History,
  Edit,
  UserCheck,
  Send,
  Building,
} from "lucide-react";

export type CaseTabKey =
  | "overview"
  | "analysis"
  | "evidence"
  | "review"
  | "execution"
  | "history";

export default function CaseDetailPage({
  params,
}: {
  params: { caseId: string };
}) {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = React.useState<CaseTabKey>("overview");

  const {
    data: caseData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.case(params.caseId),
    queryFn: () => getCaseById(params.caseId),
  });

  if (isLoading) {
    return (
      <ContentContainer>
        <LoadingState label="Memuat rincian case..." />
      </ContentContainer>
    );
  }

  if (isError || !caseData) {
    return (
      <ContentContainer>
        <ErrorState
          title="Case Tidak Ditemukan"
          message="Gagal memuat rincian case. Pastikan ID case benar atau coba muat ulang."
          onRetry={() => refetch()}
        />
      </ContentContainer>
    );
  }

  const isMaker = caseData.maker?.id === currentUser?.id || caseData.maker?.name === currentUser?.name;
  const isParticipant =
    isMaker ||
    caseData.participants.some(
      (p) => p.user_id === currentUser?.id || p.name === currentUser?.name
    );

  const tabs: { key: CaseTabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "overview", label: "Ringkasan", icon: FileText },
    { key: "analysis", label: "Analisis AI", icon: Sparkles },
    { key: "evidence", label: "Bukti Dokumen", icon: Paperclip },
    { key: "review", label: "Persetujuan", icon: CheckSquare },
    { key: "execution", label: "Eksekusi", icon: PlayCircle },
    { key: "history", label: "Riwayat / Audit", icon: History },
  ];

  return (
    <ContentContainer>
      <CaseDetailHeader caseData={caseData} isParticipant={isParticipant} />

      {/* Workflow Tabs */}
      <div className="border-b border-slate-200 mb-6">
        <nav className="flex space-x-6 overflow-x-auto" aria-label="Workflow tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  isActive
                    ? "border-blue-600 text-blue-600 font-semibold"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Panels */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Case Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Deskripsi Permasalahan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {caseData.description}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Tipe Kasus</span>
                    <span className="font-semibold text-slate-800">
                      {caseData.case_type?.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Kode Kasus</span>
                    <span className="font-mono font-medium text-slate-700">
                      {caseData.case_type?.code}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Tingkat Urgensi</span>
                    <span className="font-semibold text-slate-800">
                      {caseData.urgency}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <ParticipantAssignmentSection caseData={caseData} />

            {/* Maker Governance Controls for DRAFT state */}
            {caseData.status === "DRAFT" && (
              <SubmitCaseSection
                caseData={caseData}
                isMaker={isMaker}
                onSuccessSubmit={() => setActiveTab("analysis")}
              />
            )}
          </div>

          {/* Sidebar Metadata */}
          <div className="space-y-6">
            <Card className="border-slate-200">
              <CardHeader className="py-4">
                <CardTitle className="text-base">Tata Kelola & Pemilik</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1">Maker / Inisiator</span>
                  <div className="flex items-center gap-2 font-medium text-slate-800">
                    <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                      {caseData.maker?.name?.charAt(0) || "M"}
                    </div>
                    <span>{caseData.maker?.name}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <span className="text-slate-400 block mb-1">Owner (Permanen)</span>
                  <p className="text-slate-700 font-medium">{caseData.owner?.name}</p>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <span className="text-slate-400 block mb-1">Pembaruan Terakhir</span>
                  <p className="text-slate-600 font-mono">
                    {new Date(caseData.updated_at).toLocaleString("id-ID")}
                  </p>
                </div>
              </CardContent>
            </Card>

            <CaseParticipantsCard participants={caseData.participants} />
          </div>
        </div>
      )}

      {/* Placeholders for subsequent issues */}
      {activeTab === "analysis" && (
        <div id="tab-analysis-container">
          <EmptyState
            icon={<Sparkles className="h-8 w-8 text-blue-500" />}
            title="Analisis AI Sentinel"
            description={
              caseData.status === "DRAFT"
                ? "Analisis AI akan dijalankan setelah case diajukan oleh Maker."
                : `Analisis AI untuk status ${caseData.status}.`
            }
          />
        </div>
      )}

      {activeTab === "evidence" && (
        <div id="tab-evidence-container">
          <EmptyState
            icon={<Paperclip className="h-8 w-8 text-slate-400" />}
            title="Bukti Dokumen Pendukung"
            description="Dokumen bukti yang dilampirkan oleh Maker untuk memvalidasi kasus operasional."
          />
        </div>
      )}

      {activeTab === "review" && (
        <div id="tab-review-container">
          <EmptyState
            icon={<CheckSquare className="h-8 w-8 text-amber-500" />}
            title="Persetujuan Checker & Signer"
            description={`Status alur verifikasi saat ini: ${caseData.status}.`}
          />
        </div>
      )}

      {activeTab === "execution" && (
        <div id="tab-execution-container">
          <EmptyState
            icon={<PlayCircle className="h-8 w-8 text-emerald-500" />}
            title="Eksekusi Operasional"
            description="Langkah tindakan eksekusi setelah persetujuan otorisasi selesai."
          />
        </div>
      )}

      {activeTab === "history" && (
        <div id="tab-history-container">
          <EmptyState
            icon={<History className="h-8 w-8 text-slate-400" />}
            title="Timeline Riwayat Kasus"
            description="Jejak audit immutable untuk setiap aksi dan transisi state dalam kasus ini."
          />
        </div>
      )}
    </ContentContainer>
  );
}
