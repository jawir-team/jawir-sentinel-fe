"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { getCaseHistory } from "@/services/api/history";
import { queryKeys } from "@/constants/queryKeys";
import { CaseHistoryEvent } from "@/types/history";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { LoadingState } from "@/components/feedback/LoadingState";
import { EmptyState } from "@/components/feedback/EmptyState";
import {
  History,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  ShieldCheck,
  PlayCircle,
  FileText,
  Send,
  Paperclip,
  Lock,
  User,
  Cpu,
  Clock,
  ArrowDownUp,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface HistoryTimelineProps {
  caseId: string;
  onSelectAnalysisVersion?: (version: number) => void;
}

export function HistoryTimeline({
  caseId,
  onSelectAnalysisVersion,
}: HistoryTimelineProps) {
  const [isDescending, setIsDescending] = React.useState(true);

  const {
    data: historyEvents = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: queryKeys.history(caseId),
    queryFn: () => getCaseHistory(caseId),
  });

  if (isLoading) {
    return <LoadingState label="Loading case audit history trail..." />;
  }

  if (historyEvents.length === 0) {
    return (
      <EmptyState
        icon={<History className="h-8 w-8 text-slate-400" />}
        title="No History Events Recorded"
        description="Case audit trail will be automatically recorded as the workflow progresses."
      />
    );
  }

  const sortedEvents = [...historyEvents].sort((a, b) => {
    const timeA = new Date(a.created_at).getTime();
    const timeB = new Date(b.created_at).getTime();
    return isDescending ? timeB - timeA : timeA - timeB;
  });

  const getEventBadgeAndIcon = (event: CaseHistoryEvent) => {
    switch (event.event_type) {
      case "CASE_CREATED":
        return {
          icon: <FileText className="h-4 w-4 text-blue-600" />,
          label: "Case Created (DRAFT)",
          badgeVariant: "secondary" as const,
        };
      case "EVIDENCE_ADDED":
        return {
          icon: <Paperclip className="h-4 w-4 text-slate-600" />,
          label: "Evidence Added",
          badgeVariant: "outline" as const,
        };
      case "CASE_SUBMITTED":
        return {
          icon: <Send className="h-4 w-4 text-blue-600" />,
          label: "Case Submitted by Maker",
          badgeVariant: "default" as const,
        };
      case "AI_ANALYSIS_STARTED":
        return {
          icon: <Sparkles className="h-4 w-4 text-purple-600" />,
          label: "AI Analysis Started",
          badgeVariant: "secondary" as const,
        };
      case "AI_ANALYSIS_COMPLETED":
        return {
          icon: <Sparkles className="h-4 w-4 text-emerald-600" />,
          label: "AI Analysis Completed",
          badgeVariant: "success" as const,
        };
      case "AI_ANALYSIS_FAILED":
        return {
          icon: <AlertOctagon className="h-4 w-4 text-rose-600" />,
          label: "AI Analysis Failed",
          badgeVariant: "destructive" as const,
        };
      case "CHECKER_APPROVED":
        return {
          icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
          label: "Approved by Checker",
          badgeVariant: "success" as const,
        };
      case "CHECKER_REJECTED":
        return {
          icon: <XCircle className="h-4 w-4 text-rose-600" />,
          label: "Rejected by Checker",
          badgeVariant: "destructive" as const,
        };
      case "SIGNER_APPROVED":
        return {
          icon: <ShieldCheck className="h-4 w-4 text-purple-600" />,
          label: "Authorized by Signer",
          badgeVariant: "success" as const,
        };
      case "SIGNER_REJECTED":
        return {
          icon: <XCircle className="h-4 w-4 text-rose-600" />,
          label: "Rejected by Signer",
          badgeVariant: "destructive" as const,
        };
      case "EXECUTION_STARTED":
        return {
          icon: <PlayCircle className="h-4 w-4 text-blue-600" />,
          label: "Execution Started",
          badgeVariant: "warning" as const,
        };
      case "EXECUTION_SUCCESS":
        return {
          icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
          label: "Execution Completed Successfully (DONE)",
          badgeVariant: "success" as const,
        };
      case "EXECUTION_BLOCKED":
        return {
          icon: <AlertOctagon className="h-4 w-4 text-amber-600" />,
          label: "Execution Blocked (BLOCKED)",
          badgeVariant: "warning" as const,
        };
      case "EXECUTION_FAILED":
        return {
          icon: <XCircle className="h-4 w-4 text-rose-600" />,
          label: "Execution Failed (FAILED)",
          badgeVariant: "destructive" as const,
        };
      case "REANALYSIS_LIMIT_REACHED":
        return {
          icon: <AlertOctagon className="h-4 w-4 text-rose-600" />,
          label: "Re-analysis Quota Limit Reached",
          badgeVariant: "destructive" as const,
        };
      case "CASE_CLOSED":
        return {
          icon: <Lock className="h-4 w-4 text-slate-600" />,
          label: "Case Closed (CLOSED)",
          badgeVariant: "secondary" as const,
        };
      default:
        return {
          icon: <Clock className="h-4 w-4 text-slate-500" />,
          label: event.event_type,
          badgeVariant: "outline" as const,
        };
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm" data-testid="history-timeline">
      <CardHeader className="pb-3 border-b border-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900">
            <History className="h-4 w-4 text-blue-600" />
            <span>Case Audit Trail & Chronological History ({historyEvents.length} events)</span>
          </CardTitle>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsDescending(!isDescending)}
            className="text-xs gap-1.5 h-8"
          >
            <ArrowDownUp className="h-3.5 w-3.5" />
            <span>{isDescending ? "Newest First" : "Oldest First"}</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {sortedEvents.map((evt) => {
            const config = getEventBadgeAndIcon(evt);
            const isSystem = !evt.actor;

            return (
              <div key={evt.id} className="relative group text-xs">
                {/* Node circle on timeline */}
                <div className="absolute -left-[27px] top-0.5 h-5 w-5 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center group-hover:border-blue-500 transition-colors shadow-xs">
                  <div className="h-2 w-2 rounded-full bg-slate-400 group-hover:bg-blue-600" />
                </div>

                {/* Event Card */}
                <div className="p-3.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-colors space-y-2 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {config.icon}
                      <span className="font-semibold text-slate-900 text-sm">
                        {config.label}
                      </span>
                      <Badge variant={config.badgeVariant} className="text-[10px]">
                        {evt.event_type}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{new Date(evt.created_at).toLocaleString("en-US")}</span>
                    </div>
                  </div>

                  {/* Actor details (or SYSTEM) */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-slate-600">
                    <span className="text-slate-400">Actor:</span>
                    {isSystem ? (
                      <span className="flex items-center gap-1 font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        <Cpu className="h-3 w-3 text-slate-500" />
                        <span>SYSTEM</span>
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span>{evt.actor?.name}</span>
                        {evt.actor_role && (
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {evt.actor_role}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Associated Analysis Version */}
                    {evt.analysis_version !== null && evt.analysis_version !== undefined && (
                      <button
                        type="button"
                        onClick={() => onSelectAnalysisVersion?.(evt.analysis_version!)}
                        className="ml-auto flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 transition-colors"
                      >
                        <Sparkles className="h-3 w-3 text-blue-600" />
                        <span>Analysis Version v{evt.analysis_version}</span>
                      </button>
                    )}
                  </div>

                  {/* Safe Metadata Section */}
                  {evt.metadata && Object.keys(evt.metadata).length > 0 && (
                    <div className="mt-2 p-2.5 rounded bg-slate-50 border border-slate-100 space-y-1 text-[11px] leading-relaxed">
                      {typeof evt.metadata.reason === "string" && (
                        <p className="text-rose-950">
                          <strong className="text-rose-900">Reason:</strong> &ldquo;
                          {evt.metadata.reason}&rdquo;
                        </p>
                      )}
                      {typeof evt.metadata.comment === "string" && (
                        <p className="text-slate-700">
                          <strong className="text-slate-800">Note:</strong> &ldquo;
                          {evt.metadata.comment}&rdquo;
                        </p>
                      )}
                      {typeof evt.metadata.action_taken === "string" && (
                        <p className="text-slate-700">
                          <strong className="text-slate-800">Action Taken:</strong>{" "}
                          {evt.metadata.action_taken}
                        </p>
                      )}
                      {typeof evt.metadata.result === "string" && (
                        <p className="text-emerald-950 font-medium">
                          <strong className="text-emerald-900">Result:</strong>{" "}
                          {evt.metadata.result}
                        </p>
                      )}
                      {typeof evt.metadata.blocker === "string" && (
                        <p className="text-rose-950">
                          <strong className="text-rose-900">Blocker:</strong>{" "}
                          {evt.metadata.blocker}
                        </p>
                      )}
                      {typeof evt.metadata.failure_type === "string" && (
                        <div className="flex items-center gap-1.5 text-rose-900 font-semibold">
                          <AlertOctagon className="h-3.5 w-3.5 text-rose-600" />
                          <span>Failure Cause: {evt.metadata.failure_type}</span>
                        </div>
                      )}
                      {typeof evt.metadata.max_reanalysis === "number" && (
                        <p className="text-rose-900 font-medium">
                          Maximum re-analysis limit reached (limit: {evt.metadata.max_reanalysis} cycles).
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
