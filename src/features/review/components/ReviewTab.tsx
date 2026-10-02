"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { CaseDetail } from "@/types/case";
import { getCheckerStatus } from "@/services/api/reviews";
import { queryKeys } from "@/constants/queryKeys";
import { useAuth } from "@/features/auth/context/AuthContext";
import { CheckerStatusCard } from "./CheckerStatusCard";
import { CheckerDecisionModal } from "./CheckerDecisionModal";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingState } from "@/components/feedback/LoadingState";
import { EmptyState } from "@/components/feedback/EmptyState";
import {
  CheckSquare,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Info,
  AlertTriangle,
} from "lucide-react";

interface ReviewTabProps {
  caseData: CaseDetail;
  onNavigateToTab?: (tabKey: string) => void;
}

export function ReviewTab({ caseData, onNavigateToTab }: ReviewTabProps) {
  const { currentUser } = useAuth();
  const [decisionModal, setDecisionModal] = React.useState<{
    isOpen: boolean;
    decision: "APPROVE" | "REJECT";
  }>({
    isOpen: false,
    decision: "APPROVE",
  });

  const isChecking = caseData.status === "CHECKING";
  const isSigning = caseData.status === "SIGNING";
  const currentAnalysisId = caseData.current_analysis?.id;

  const {
    data: checkerStatus,
    isLoading: isLoadingStatus,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: queryKeys.checkerStatus(caseData.id),
    queryFn: () => getCheckerStatus(caseData.id),
    enabled: Boolean(currentAnalysisId) && (isChecking || isSigning),
  });

  // Check if current user is an assigned Checker
  const isAssignedChecker = caseData.participants.some(
    (p) =>
      p.role === "CHECKER" &&
      p.status === "ACTIVE" &&
      (p.user_id === currentUser?.id || p.name === currentUser?.name)
  );

  // Find current user's decision status in the active round
  const myCheckerRecord = checkerStatus?.checkers.find(
    (c) => c.user_id === currentUser?.id || c.name === currentUser?.name
  );
  const myStatus = myCheckerRecord?.status || "PENDING";

  if (!currentAnalysisId) {
    return (
      <EmptyState
        icon={<CheckSquare className="h-8 w-8 text-slate-400" />}
        title="Persetujuan Belum Dibuka"
        description={
          caseData.status === "DRAFT"
            ? "Persetujuan Checker akan dimulai setelah case diajukan oleh Maker dan lolos analisis AI."
            : `Persetujuan belum dapat dilakukan pada status ${caseData.status}.`
        }
      />
    );
  }

  if (isLoadingStatus) {
    return <LoadingState label="Memuat status verifikasi Checker..." />;
  }

  return (
    <div className="space-y-6" data-testid="review-tab">
      {/* Checker Review Action Card for assigned active Checker */}
      {isChecking && isAssignedChecker && (
        <Card className="border-blue-300 bg-blue-50/30 shadow-sm">
          <CardHeader className="pb-3 border-b border-blue-100">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-blue-950">
                <CheckSquare className="h-4 w-4 text-blue-600" />
                <span>Aksi Verifikasi Checker Anda</span>
              </CardTitle>
              <Badge variant="outline" className="font-mono text-xs">
                {currentUser?.name} &bull; CHECKER
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            {myStatus === "APPROVED" ? (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 text-emerald-900">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold text-sm">Persetujuan Terkirim</p>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Anda telah menyetujui hasil analisis ini. Menunggu Checker wajib lainnya untuk menyelesaikan korum persetujuan.
                  </p>
                </div>
              </div>
            ) : myStatus === "REJECTED" ? (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-3 text-rose-900">
                <XCircle className="h-5 w-5 text-rose-600 shrink-0" />
                <div>
                  <p className="font-bold text-sm">Penolakan Terkirim</p>
                  <p className="text-[11px] text-rose-800 mt-0.5">
                    Anda telah menolak hasil analisis putaran ini. Sistem sedang mengalihkan kasus ke re-analisis atau eskalasi.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-slate-700 leading-relaxed">
                  Sebagai Checker yang ditugaskan, silakan periksa ringkasan analisis, validitas klausul SOP yang dikutip, dan kelengkapan bukti pendukung pada tab Analisis AI sebelum memberikan keputusan.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() =>
                      setDecisionModal({ isOpen: true, decision: "APPROVE" })
                    }
                    className="gap-1.5"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Setujui Hasil Analisis (Approve)</span>
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() =>
                      setDecisionModal({ isOpen: true, decision: "REJECT" })
                    }
                    className="gap-1.5"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Tolak Hasil Analisis (Reject)</span>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Non-checker info banner during CHECKING */}
      {isChecking && !isAssignedChecker && (
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-3 text-xs text-slate-700">
          <Info className="h-4 w-4 text-slate-500 shrink-0" />
          <p>
            Kasus saat ini berada pada tahap <strong>CHECKING</strong>. Hanya pengguna yang terdaftar sebagai <strong>Checker</strong> pada kasus ini yang dapat mengirimkan persetujuan atau penolakan.
          </p>
        </div>
      )}

      {/* Checker Completion Status Card */}
      {checkerStatus && (
        <CheckerStatusCard
          statusData={checkerStatus}
          isChecking={isChecking}
        />
      )}

      {/* Decision Submission Modal */}
      {currentAnalysisId && (
        <CheckerDecisionModal
          isOpen={decisionModal.isOpen}
          onClose={() =>
            setDecisionModal((prev) => ({ ...prev, isOpen: false }))
          }
          caseId={caseData.id}
          analysisId={currentAnalysisId}
          decision={decisionModal.decision}
          onSuccessDecision={(nextStatus) => {
            refetchStatus();
          }}
        />
      )}
    </div>
  );
}
