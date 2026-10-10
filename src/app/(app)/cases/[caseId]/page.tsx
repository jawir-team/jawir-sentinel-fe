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
import { EvidenceTab } from "@/features/evidence/components/EvidenceTab";
import { AnalysisTab } from "@/features/analysis/components/AnalysisTab";
import { ReviewTab } from "@/features/review/components/ReviewTab";
import { ExecutionTab } from "@/features/execution/components/ExecutionTab";
import { HistoryTimeline } from "@/features/history/components/HistoryTimeline";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
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
  const [requestedAnalysisVersion, setRequestedAnalysisVersion] =
    React.useState<number | null>(null);

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
        <LoadingState label="Loading case details..." />
      </ContentContainer>
    );
  }

  if (isError || !caseData) {
    return (
      <ContentContainer>
        <ErrorState
          title="Case Not Found"
          message="Failed to load case details. Verify the case ID or try reloading."
          onRetry={() => refetch()}
        />
      </ContentContainer>
    );
  }

  const isMaker = caseData.maker?.id === currentUser?.id;
  const isParticipant =
    isMaker ||
    caseData.participants.some(
      (p) => p.user_id === currentUser?.id && p.status === "ACTIVE"
    );

  const tabs: { key: CaseTabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "overview", label: "Overview", icon: FileText },
    { key: "analysis", label: "AI Analysis", icon: Sparkles },
    { key: "evidence", label: "Evidence", icon: Paperclip },
    { key: "review", label: "Reviews & Approvals", icon: CheckSquare },
    { key: "execution", label: "Execution", icon: PlayCircle },
    { key: "history", label: "Audit History", icon: History },
  ];

  return (
    <ContentContainer>
      <CaseDetailHeader caseData={caseData} isParticipant={isParticipant} />

      {caseData.status === "DRAFT" ? (
        <Alert variant="info" title="DRAFT · Governance Setup Open" className="mb-6">
          The Maker can complete participant assignments while this case remains in DRAFT.
          Submission freezes the case core data and participant set.
        </Alert>
      ) : (
        <Alert variant="warning" title="Submitted · Governance Context Frozen" className="mb-6">
          Core case data and participant assignments are read-only after DRAFT. Evidence and
          workflow actions remain available only where the current state and assigned role allow.
        </Alert>
      )}

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
                <CardTitle className="text-base">Problem Description</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {caseData.description}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Case Type</span>
                    <span className="font-semibold text-slate-800">
                      {caseData.case_type?.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Case Code</span>
                    <span className="font-mono font-medium text-slate-700">
                      {caseData.case_type?.code}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Urgency Level</span>
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
                <CardTitle className="text-base">Governance & Ownership</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1">Owner / Maker (Permanent)</span>
                  <div className="flex items-center gap-2 font-medium text-slate-800">
                    <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                      {caseData.maker?.name?.charAt(0) || "M"}
                    </div>
                    <span>{caseData.maker?.name}</span>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
                    The case creator is both Owner and Maker. This identity cannot be reassigned.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <span className="text-slate-400 block mb-1">Last Updated</span>
                  <p className="text-slate-600 font-mono">
                    {new Date(caseData.updated_at).toLocaleString("en-US")}
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
          <AnalysisTab
            caseData={caseData}
            requestedVersion={requestedAnalysisVersion}
          />
        </div>
      )}

      {activeTab === "evidence" && (
        <div id="tab-evidence-container">
          <EvidenceTab caseData={caseData} />
        </div>
      )}

      {activeTab === "review" && (
        <div id="tab-review-container">
          <ReviewTab caseData={caseData} />
        </div>
      )}

      {activeTab === "execution" && (
        <div id="tab-execution-container">
          <ExecutionTab caseData={caseData} />
        </div>
      )}

      {activeTab === "history" && (
        <div id="tab-history-container">
          <HistoryTimeline
            caseId={caseData.id}
            onSelectAnalysisVersion={(version) => {
              setRequestedAnalysisVersion(version);
              setActiveTab("analysis");
            }}
          />
        </div>
      )}
    </ContentContainer>
  );
}
