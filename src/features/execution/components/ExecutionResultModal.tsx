"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { FormField } from "@/components/ui/FormField";
import { Alert } from "@/components/ui/Alert";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitExecutionResult } from "@/services/api/executions";
import { queryKeys } from "@/constants/queryKeys";
import { CheckCircle2, AlertOctagon, XCircle, AlertTriangle } from "lucide-react";

interface ExecutionResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  executionId: string;
  targetStatus: "SUCCESS" | "BLOCKED" | "FAILED";
  onSuccessResult?: (nextStatus: string) => void;
  onStaleConflict?: () => void;
}

export function ExecutionResultModal({
  isOpen,
  onClose,
  caseId,
  executionId,
  targetStatus,
  onSuccessResult,
  onStaleConflict,
}: ExecutionResultModalProps) {
  const queryClient = useQueryClient();
  const [actionTaken, setActionTaken] = React.useState("");
  const [resultText, setResultText] = React.useState("");
  const [blockerText, setBlockerText] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setActionTaken("");
      setResultText("");
      setBlockerText("");
      setErrorMessage(null);
    }
  }, [isOpen, targetStatus]);

  const resultMutation = useMutation({
    mutationFn: () =>
      submitExecutionResult(caseId, executionId, {
        status: targetStatus,
        action_taken: actionTaken.trim(),
        result: resultText.trim() || undefined,
        blocker: blockerText.trim() || undefined,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.case(caseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cases() });
      queryClient.invalidateQueries({ queryKey: queryKeys.history(caseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: ["executions", caseId] });

      onSuccessResult?.(data.case_status);
      onClose();
    },
    onError: (err: any) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.case(caseId) });
      queryClient.invalidateQueries({ queryKey: ["executions", caseId] });
      if (err?.status === 409 || err?.code === "STALE_ANALYSIS") {
        onStaleConflict?.();
        onClose();
        return;
      }
      const msg =
        err?.message ||
        "Failed to save execution result. Please check the current case status.";
      setErrorMessage(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionTaken.trim()) {
      setErrorMessage("Operational actions taken (action_taken) is required.");
      return;
    }

    if (targetStatus === "SUCCESS" && !resultText.trim()) {
      setErrorMessage("Resolution outcome confirmation (result) is required for SUCCESS status.");
      return;
    }

    if ((targetStatus === "BLOCKED" || targetStatus === "FAILED") && !blockerText.trim()) {
      setErrorMessage(
        "Blocker description (blocker) is required to document reasons for failure or blockage."
      );
      return;
    }

    setErrorMessage(null);
    resultMutation.mutate();
  };

  const getTitleAndDesc = () => {
    switch (targetStatus) {
      case "SUCCESS":
        return {
          title: "Report Execution Success (SUCCESS)",
          desc: "Confirm that all recommended operational actions have been fully executed. The case will transition to DONE status.",
          btnLabel: "Confirm Execution Success (DONE)",
          variant: "primary" as const,
        };
      case "BLOCKED":
        return {
          title: "Report Execution Blocked (BLOCKED)",
          desc: "Execution actions are obstructed by external factors or system dependencies. The case will be directed to AI re-analysis or escalation.",
          btnLabel: "Confirm Execution Blocked",
          variant: "outline" as const,
        };
      case "FAILED":
        return {
          title: "Report Execution Failed (FAILED)",
          desc: "Execution actions encountered operational failure. The case will be directed to AI re-analysis or escalation if the quota limit is reached.",
          btnLabel: "Confirm Execution Failed",
          variant: "destructive" as const,
        };
    }
  };

  const config = getTitleAndDesc();

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={config.title}
      description={config.desc}
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={resultMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={config.variant}
            size="sm"
            onClick={handleSubmit}
            isLoading={resultMutation.isPending}
          >
            {config.btnLabel}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {errorMessage && (
          <Alert variant="destructive" title="Execution Result Validation">
            {errorMessage}
          </Alert>
        )}

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
          <span className="text-[11px] text-slate-500 font-mono block">
            Active Execution ID:
          </span>
          <span className="font-mono font-bold text-slate-900 text-xs">
            {executionId}
          </span>
        </div>

        <FormField
          label="Operational Actions Taken (Action Taken - Required)"
          required
        >
          <Textarea
            rows={3}
            placeholder="Example: Isolated 37 mismatched transactions from clearing pool and triggered manual reconciliation retry..."
            value={actionTaken}
            onChange={(e) => setActionTaken(e.target.value)}
            required
          />
        </FormField>

        {targetStatus === "SUCCESS" && (
          <FormField label="Resolution Outcome Confirmation (Result - Required)" required>
            <Textarea
              rows={2}
              placeholder="Example: Full batch reconciliation completed balanced and ledger synchronized with zero discrepancy."
              value={resultText}
              onChange={(e) => setResultText(e.target.value)}
              required
            />
          </FormField>
        )}

        {(targetStatus === "BLOCKED" || targetStatus === "FAILED") && (
          <FormField
            label="Blocker / Impediment Description (Blocker - Required)"
            required
          >
            <Textarea
              rows={3}
              placeholder="Example: Upstream clearing file from correspondent bank unreachable or timed out..."
              value={blockerText}
              onChange={(e) => setBlockerText(e.target.value)}
              required
            />
          </FormField>
        )}
      </form>
    </Dialog>
  );
}
