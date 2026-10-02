"use client";

import * as React from "react";
import { AlertOctagon, HelpCircle, ShieldAlert, RefreshCw, Info } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

export type EscalationCause =
  | "VERIFIER_FAIL"
  | "TECHNICAL_RETRY_EXHAUSTED"
  | "REANALYSIS_LIMIT_REACHED"
  | "UNKNOWN";

interface EscalationNoticeProps {
  cause?: EscalationCause;
  failureReason?: string | null;
  versionCount?: number;
}

export function EscalationNotice({
  cause = "UNKNOWN",
  failureReason,
  versionCount = 1,
}: EscalationNoticeProps) {
  const getCauseDetails = () => {
    switch (cause) {
      case "VERIFIER_FAIL":
        return {
          title: "Model Integrity Verification Failure (VERIFIER_FAIL)",
          badge: "VERIFIER FAIL",
          explanation:
            "The AI inference output was rejected by the internal verifier due to critical anomalies (such as invalid/hallucinated policy clauses or unregistered evidence citations).",
          actionAdvice:
            "Review case evidence and verification notes. Additional valid evidence or manual policy reassessment is required.",
        };
      case "TECHNICAL_RETRY_EXHAUSTED":
        return {
          title: "Technical Retry Limit Exhausted (TECHNICAL_RETRY_EXHAUSTED)",
          badge: "TECHNICAL RETRY EXHAUSTED",
          explanation:
            "Technical connectivity or model provider inference experienced repeated timeouts or internal errors, exhausting all system retry attempts.",
          actionAdvice:
            "Check AI infrastructure status or contact system administration. The case cannot proceed via automated inference.",
        };
      case "REANALYSIS_LIMIT_REACHED":
        return {
          title: "Re-analysis Attempt Limit Reached (REANALYSIS_LIMIT_REACHED)",
          badge: "LIMIT REACHED (MAX 3 RE-ANALYSIS)",
          explanation: `Automated re-analysis cycles reached the maximum threshold (attempt #${versionCount}) following repeated review rejections or execution blockers.`,
          actionAdvice:
            "In accordance with Sentinel risk governance, this case must be transitioned to manual handling or closed (Close Case) for separate re-creation.",
        };
      default:
        return {
          title: "Escalation Required",
          badge: "ESCALATION REQUIRED",
          explanation:
            failureReason ||
            "The case requires manual operational intervention because automated analysis could not proceed.",
          actionAdvice:
            "Review case audit history and available evidence documents to determine subsequent operational actions.",
        };
    }
  };

  const details = getCauseDetails();

  return (
    <Card className="border-rose-300 bg-rose-50/40 shadow-sm" data-testid="escalation-notice">
      <CardHeader className="pb-3 border-b border-rose-100">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-rose-950">
            <AlertOctagon className="h-5 w-5 text-rose-600 shrink-0" />
            <span>{details.title}</span>
          </CardTitle>
          <Badge variant="destructive" className="font-mono text-xs">
            {details.badge}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-3 text-xs">
        <div className="p-3 bg-white border border-rose-200 rounded-lg text-slate-800 leading-relaxed">
          <p className="font-medium text-rose-900 mb-1">Escalation Cause:</p>
          <p>{details.explanation}</p>
        </div>

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 leading-relaxed">
          <div className="flex items-center gap-1.5 font-semibold text-amber-950 mb-1">
            <Info className="h-4 w-4 text-amber-700 shrink-0" />
            <span>Operational Guidance:</span>
          </div>
          <p className="text-[11px]">{details.actionAdvice}</p>
          <p className="text-[11px] mt-2 font-mono text-amber-800">
            Governance Note: In this release, manual resume or instant re-analysis triggers are restricted to preserve Segregation of Duties integrity.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
