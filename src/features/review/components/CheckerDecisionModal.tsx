"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { FormField } from "@/components/ui/FormField";
import { Alert } from "@/components/ui/Alert";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitCheckerDecision } from "@/services/api/reviews";
import { queryKeys } from "@/constants/queryKeys";
import { ReviewDecision } from "@/types/review";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

interface CheckerDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  analysisId: string;
  decision: ReviewDecision;
  onSuccessDecision?: (nextStatus: string) => void;
  onStaleConflict?: () => void;
}

export function CheckerDecisionModal({
  isOpen,
  onClose,
  caseId,
  analysisId,
  decision,
  onSuccessDecision,
  onStaleConflict,
}: CheckerDecisionModalProps) {
  const queryClient = useQueryClient();
  const [reason, setReason] = React.useState("");
  const [comment, setComment] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const isReject = decision === "REJECT";

  React.useEffect(() => {
    if (isOpen) {
      setReason("");
      setComment("");
      setErrorMessage(null);
    }
  }, [isOpen]);

  const decisionMutation = useMutation({
    mutationFn: () =>
      submitCheckerDecision(caseId, {
        analysis_id: analysisId,
        decision,
        reason: isReject ? reason.trim() : undefined,
        comment: comment.trim() || undefined,
      }),
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.case(caseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cases() });
      queryClient.invalidateQueries({ queryKey: queryKeys.analyses(caseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.analysisCurrent(caseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.checkerStatus(caseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.history(caseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });

      onSuccessDecision?.(data.case_status);
      onClose();
    },
    onError: (err: any) => {
      if (err?.status === 409 || err?.code === "STALE_ANALYSIS") {
        onStaleConflict?.();
        onClose();
        return;
      }
      const msg =
        err?.message ||
        "Failed to submit Checker decision. Please try again.";
      setErrorMessage(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReject && !reason.trim()) {
      setErrorMessage("A rejection reason is required to document audit findings.");
      return;
    }
    setErrorMessage(null);
    decisionMutation.mutate();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        isReject
          ? "Reject AI Analysis (Checker Reject)"
          : "Approve AI Analysis (Checker Approve)"
      }
      description={
        isReject
          ? "Rejection will conclude this verification round and trigger automated re-analysis (or escalation if attempt limit is reached)."
          : "Confirm that the AI inference analysis and evidence citations are acceptable to advance to Signer authorization."
      }
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={decisionMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={isReject ? "destructive" : "primary"}
            size="sm"
            onClick={handleSubmit}
            isLoading={decisionMutation.isPending}
          >
            {isReject ? "Confirm Rejection" : "Confirm Approval"}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {errorMessage && (
          <Alert variant="destructive" title="Decision Submission Issue">
            {errorMessage}
          </Alert>
        )}

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
          <span className="text-[11px] text-slate-500 font-mono block">
            Target Analysis for Review:
          </span>
          <span className="font-mono font-bold text-slate-900 text-xs">
            {analysisId}
          </span>
        </div>

        {isReject ? (
          <>
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-rose-900">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                <strong>Governance Notice:</strong> Your rejection reason will be permanently recorded in the audit trail and factored into subsequent inference evaluations.
              </p>
            </div>

            <FormField label="Rejection Reason (Required)" required>
              <Textarea
                rows={3}
                placeholder="Example: SOP-OPS-001 clause 4.2 does not account for evening batch clearing exceptions..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </FormField>

            <FormField label="Additional Notes (Optional)">
              <Textarea
                rows={2}
                placeholder="Add recommendations, guidance, or evidence remediation notes..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </FormField>
          </>
        ) : (
          <>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2 text-emerald-900">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                Your approval will be recorded for the current round. The Signer authorization stage unlocks once all required Checkers have approved.
              </p>
            </div>

            <FormField label="Approval Notes (Optional)">
              <Textarea
                rows={2}
                placeholder="Example: Facts and policy references verified in accordance with SLA..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </FormField>
          </>
        )}
      </form>
    </Dialog>
  );
}
