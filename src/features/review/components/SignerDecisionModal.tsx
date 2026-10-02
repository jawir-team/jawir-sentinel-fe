"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { FormField } from "@/components/ui/FormField";
import { Alert } from "@/components/ui/Alert";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitSignerDecision } from "@/services/api/reviews";
import { queryKeys } from "@/constants/queryKeys";
import { ReviewDecision } from "@/types/review";
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck } from "lucide-react";

interface SignerDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  analysisId: string;
  decision: ReviewDecision;
  onSuccessDecision?: (nextStatus: string) => void;
  onStaleConflict?: () => void;
}

export function SignerDecisionModal({
  isOpen,
  onClose,
  caseId,
  analysisId,
  decision,
  onSuccessDecision,
  onStaleConflict,
}: SignerDecisionModalProps) {
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
      submitSignerDecision(caseId, {
        analysis_id: analysisId,
        decision,
        reason: isReject ? reason.trim() : undefined,
        comment: comment.trim() || undefined,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.case(caseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cases() });
      queryClient.invalidateQueries({ queryKey: queryKeys.analyses(caseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.analysisCurrent(caseId) });
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
        "Failed to submit Signer decision. Please try again.";
      setErrorMessage(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReject && !reason.trim()) {
      setErrorMessage("A rejection reason is required for authorization governance documentation.");
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
          ? "Executive Authorization Rejection (Signer Reject)"
          : "Executive Case Authorization (Signer Approve)"
      }
      description={
        isReject
          ? "Signer rejection will trigger automated re-analysis (or governance escalation if the quota limit is reached)."
          : "Signer approval authorizes this case to be executed by the authorized Executer (Status: EXECUTION)."
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
            {isReject ? "Confirm Signer Rejection" : "Confirm Authorization (Approve)"}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {errorMessage && (
          <Alert variant="destructive" title="Authorization Submission Error">
            {errorMessage}
          </Alert>
        )}

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
          <span className="text-[11px] text-slate-500 font-mono block">
            Target Analysis for Authorization:
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
                <strong>Governance Notice:</strong> Signer rejection indicates executive disapproval of the proposed action plan. A rejection reason must be recorded.
              </p>
            </div>

            <FormField label="Executive Rejection Reason (Required)" required>
              <Textarea
                rows={3}
                placeholder="Example: Operational risk impact is too high for the current clearing window..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </FormField>

            <FormField label="Additional Notes (Optional)">
              <Textarea
                rows={2}
                placeholder="Add alternative remediation guidance..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </FormField>
          </>
        ) : (
          <>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2 text-emerald-900">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                By authorizing this case, you grant full mandate to the Executer to carry out operational actions in accordance with the analysis recommendations.
              </p>
            </div>

            <FormField label="Executive Authorization Notes (Optional)">
              <Textarea
                rows={2}
                placeholder="Example: Approved for clearing batch exception remediation..."
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
