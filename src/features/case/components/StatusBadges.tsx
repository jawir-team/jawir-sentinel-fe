import * as React from "react";
import { Badge } from "@/components/ui/Badge";
import { CaseStatus, Urgency } from "@/types/case";

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  switch (status) {
    case "DRAFT":
      return (
        <Badge variant="outline" dot>
          DRAFT
        </Badge>
      );
    case "AI_ANALYSIS":
      return (
        <Badge variant="default" dot>
          AI_ANALYSIS
        </Badge>
      );
    case "CHECKING":
      return (
        <Badge variant="warning" dot>
          CHECKING
        </Badge>
      );
    case "SIGNING":
      return (
        <Badge variant="warning" dot>
          SIGNING
        </Badge>
      );
    case "EXECUTION":
      return (
        <Badge variant="default" dot>
          EXECUTION
        </Badge>
      );
    case "DONE":
      return (
        <Badge variant="success" dot>
          DONE
        </Badge>
      );
    case "CLOSED":
      return (
        <Badge variant="secondary" dot>
          CLOSED
        </Badge>
      );
    case "ESCALATION_REQUIRED":
      return (
        <Badge variant="destructive" dot>
          ESCALATION_REQUIRED
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  switch (urgency) {
    case "LOW":
      return <Badge variant="secondary">LOW</Badge>;
    case "MEDIUM":
      return <Badge variant="default">MEDIUM</Badge>;
    case "HIGH":
      return <Badge variant="warning">HIGH</Badge>;
    case "CRITICAL":
      return <Badge variant="destructive">CRITICAL</Badge>;
    default:
      return <Badge variant="secondary">{urgency}</Badge>;
  }
}
