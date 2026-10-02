"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";

interface StaleAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
}

export function StaleAnalysisModal({
  isOpen,
  onClose,
  caseId,
}: StaleAnalysisModalProps) {
  const queryClient = useQueryClient();

  const handleRefreshAndClose = () => {
    // Invalidate and refetch all authoritative queries
    queryClient.invalidateQueries({ queryKey: queryKeys.case(caseId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.cases() });
    queryClient.invalidateQueries({ queryKey: queryKeys.analyses(caseId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.analysisCurrent(caseId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.checkerStatus(caseId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.history(caseId) });
    queryClient.invalidateQueries({ queryKey: ["executions", caseId] });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });

    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleRefreshAndClose}
      title="Analysis Version Conflict (STALE_ANALYSIS)"
      description="The analysis results or case workflow context changed before your decision could be processed."
      footer={
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleRefreshAndClose}
          className="gap-1.5"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Reload & Review Latest Analysis</span>
        </Button>
      }
    >
      <div className="space-y-4 text-xs">
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3 text-amber-950">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-sm">
              Your Decision Was Not Applied
            </p>
            <p className="text-[11px] leading-relaxed text-amber-900">
              The backend rejected your review/authorization action (code: <code>409 STALE_ANALYSIS</code>) because the analysis version you were viewing was superseded by a newer version or the case status transitioned.
            </p>
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-slate-700">
          <span className="font-semibold text-slate-900 block">
            Governance Safety Principles:
          </span>
          <ul className="list-disc pl-5 space-y-1 text-[11px]">
            <li>The system will <strong>never</strong> automatically re-apply or retry your decision on a newer analysis version.</li>
            <li>All case versions and authoritative verification records will be resynchronized to your interface.</li>
            <li>Please re-evaluate the recommendation clauses on the latest analysis before submitting a new approval or directive.</li>
          </ul>
        </div>
      </div>
    </Dialog>
  );
}
