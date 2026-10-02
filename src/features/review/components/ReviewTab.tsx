"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { CaseDetail } from "@/types/case";
import { getCheckerStatus } from "@/services/api/reviews";
import { queryKeys } from "@/constants/queryKeys";
import { useAuth } from "@/features/auth/context/AuthContext";
import { CheckerStatusCard } from "./CheckerStatusCard";
import { CheckerDecisionModal } from "./CheckerDecisionModal";
import { SignerDecisionModal } from "./SignerDecisionModal";
import { StaleAnalysisModal } from "@/components/feedback/StaleAnalysisModal";
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
  FileCheck,
} from "lucide-react";

interface ReviewTabProps {
  caseData: CaseDetail;
  onNavigateToTab?: (tabKey: string) => void;
}

export function ReviewTab({ caseData, onNavigateToTab }: ReviewTabProps) {
  const { currentUser } = useAuth();

  // Checker decision modal state
  const [checkerModal, setCheckerModal] = React.useState<{
    isOpen: boolean;
    decision: "APPROVE" | "REJECT";
  }>({
    isOpen: false,
    decision: "APPROVE",
  });

  // Signer decision modal state
  const [signerModal, setSignerModal] = React.useState<{
    isOpen: boolean;
    decision: "APPROVE" | "REJECT";
  }>({
    isOpen: false,
    decision: "APPROVE",
  });

  const [isStaleConflict, setIsStaleConflict] = React.useState(false);

  const isChecking = caseData.status === "CHECKING";
  const isSigning = caseData.status === "SIGNING";
  const isExecution = caseData.status === "EXECUTION";
  const currentAnalysisId = caseData.current_analysis?.id;

  const {
    data: checkerStatus,
    isLoading: isLoadingStatus,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: queryKeys.checkerStatus(caseData.id),
    queryFn: () => getCheckerStatus(caseData.id),
    enabled: Boolean(currentAnalysisId) && (isChecking || isSigning || isExecution),
  });

  // Check if current user is an assigned Checker
  const isAssignedChecker = caseData.participants.some(
    (p) =>
      p.role === "CHECKER" &&
      p.status === "ACTIVE" &&
      (p.user_id === currentUser?.id || p.name === currentUser?.name)
  );

  // Check if current user is the assigned Signer
  const signerParticipant = caseData.participants.find(
    (p) => p.role === "SIGNER" && p.status === "ACTIVE"
  );
  const isAssignedSigner = Boolean(
    signerParticipant &&
      (signerParticipant.user_id === currentUser?.id ||
        signerParticipant.name === currentUser?.name)
  );

  // Find current user's decision status in the active checker round
  const myCheckerRecord = checkerStatus?.checkers.find(
    (c) => c.user_id === currentUser?.id || c.name === currentUser?.name
  );
  const myStatus = myCheckerRecord?.status || "PENDING";

  if (!currentAnalysisId) {
    return (
      <EmptyState
        icon={<CheckSquare className="h-8 w-8 text-slate-400" />}
        title="Reviews Not Yet Open"
        description={
          caseData.status === "DRAFT"
            ? "Checker reviews will begin once the case is submitted by Maker and passes AI analysis."
            : `Reviews cannot be conducted in ${caseData.status} status.`
        }
      />
    );
  }

  if (isLoadingStatus) {
    return <LoadingState label="Loading Checker & Signer verification status..." />;
  }

  return (
    <div className="space-y-6" data-testid="review-tab">
      {/* Signer Authorization Card (Status: SIGNING) */}
      {isSigning && (
        <Card className="border-purple-300 bg-purple-50/30 shadow-sm" data-testid="signer-card">
          <CardHeader className="pb-3 border-b border-purple-100">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-purple-950">
                <FileCheck className="h-4 w-4 text-purple-700" />
                <span>Executive Authorization (Signer Review)</span>
              </CardTitle>
              <Badge variant="outline" className="font-mono text-xs border-purple-300 text-purple-900 bg-purple-50">
                SIGNER: {signerParticipant?.name || "Unassigned"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            {isAssignedSigner ? (
              <div className="space-y-3">
                <div className="p-3 bg-purple-100/60 border border-purple-200 rounded-lg text-purple-950 leading-relaxed">
                  <p className="font-semibold text-xs mb-1">
                    All Required Checkers Have Approved (Quorum Met).
                  </p>
                  <p className="text-[11px] text-purple-900">
                    As the designated Signer, you are empowered to authorize execution of this action plan or reject with written justification.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() =>
                      setSignerModal({ isOpen: true, decision: "APPROVE" })
                    }
                    className="bg-purple-700 hover:bg-purple-800 text-white gap-1.5 shadow-sm"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>Authorize Case (Signer Approve)</span>
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() =>
                      setSignerModal({ isOpen: true, decision: "REJECT" })
                    }
                    className="gap-1.5"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Reject Authorization (Signer Reject)</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-3 text-slate-700">
                <Info className="h-4 w-4 text-purple-600 shrink-0" />
                <p>
                  All required Checkers have approved. The case is currently awaiting final executive authorization from the designated Signer (
                  <strong className="text-purple-950">{signerParticipant?.name}</strong>).
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Checker Review Action Card for assigned active Checker (Status: CHECKING) */}
      {isChecking && isAssignedChecker && (
        <Card className="border-blue-300 bg-blue-50/30 shadow-sm" data-testid="checker-action-card">
          <CardHeader className="pb-3 border-b border-blue-100">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-blue-950">
                <CheckSquare className="h-4 w-4 text-blue-600" />
                <span>Your Checker Verification Action</span>
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
                  <p className="font-bold text-sm">Approval Submitted</p>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    You have approved this analysis. Awaiting remaining required Checkers to complete quorum.
                  </p>
                </div>
              </div>
            ) : myStatus === "REJECTED" ? (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-3 text-rose-900">
                <XCircle className="h-5 w-5 text-rose-600 shrink-0" />
                <div>
                  <p className="font-bold text-sm">Rejection Submitted</p>
                  <p className="text-[11px] text-rose-800 mt-0.5">
                    You have rejected this analysis round. The system is routing the case to re-analysis or escalation.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-slate-700 leading-relaxed">
                  As an assigned Checker, please inspect the analysis summary, cited SOP clause validity, and supporting evidence in the AI Analysis tab before recording your decision.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() =>
                      setCheckerModal({ isOpen: true, decision: "APPROVE" })
                    }
                    className="gap-1.5"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Approve Analysis (Approve)</span>
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() =>
                      setCheckerModal({ isOpen: true, decision: "REJECT" })
                    }
                    className="gap-1.5"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Reject Analysis (Reject)</span>
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
            The case is currently in <strong>CHECKING</strong> status. Only users assigned as <strong>Checkers</strong> on this case may submit approvals or rejections.
          </p>
        </div>
      )}

      {/* Execution status indicator */}
      {isExecution && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 text-xs text-emerald-900">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <div>
            <p className="font-bold text-sm">Authorization Completed</p>
            <p className="text-[11px] text-emerald-800 mt-0.5">
              This case has been authorized by the Signer and is currently in the Operational Execution stage.
            </p>
          </div>
        </div>
      )}

      {/* Checker Completion Status Card */}
      {checkerStatus && (
        <CheckerStatusCard
          statusData={checkerStatus}
          isChecking={isChecking}
        />
      )}

      {/* Checker Decision Submission Modal */}
      {currentAnalysisId && (
        <CheckerDecisionModal
          isOpen={checkerModal.isOpen}
          onClose={() =>
            setCheckerModal((prev) => ({ ...prev, isOpen: false }))
          }
          caseId={caseData.id}
          analysisId={currentAnalysisId}
          decision={checkerModal.decision}
          onSuccessDecision={() => {
            refetchStatus();
          }}
          onStaleConflict={() => setIsStaleConflict(true)}
        />
      )}

      {/* Signer Decision Submission Modal */}
      {currentAnalysisId && (
        <SignerDecisionModal
          isOpen={signerModal.isOpen}
          onClose={() =>
            setSignerModal((prev) => ({ ...prev, isOpen: false }))
          }
          caseId={caseData.id}
          analysisId={currentAnalysisId}
          decision={signerModal.decision}
          onSuccessDecision={() => {
            refetchStatus();
          }}
          onStaleConflict={() => setIsStaleConflict(true)}
        />
      )}

      {/* Stale Analysis Conflict Modal */}
      <StaleAnalysisModal
        isOpen={isStaleConflict}
        onClose={() => setIsStaleConflict(false)}
        caseId={caseData.id}
      />
    </div>
  );
}
