import * as React from "react";
import { Badge } from "@/components/ui/Badge";
import { PolicyVersionStatus, IndexStatus } from "@/types/policy";

export function PolicyAuthorityBadge({ status }: { status: PolicyVersionStatus }) {
  switch (status) {
    case "ACTIVE":
      return (
        <Badge variant="success" dot>
          AUTHORITY: ACTIVE
        </Badge>
      );
    case "DRAFT":
      return (
        <Badge variant="outline" dot>
          AUTHORITY: DRAFT
        </Badge>
      );
    case "SUPERSEDED":
      return (
        <Badge variant="secondary" dot>
          AUTHORITY: SUPERSEDED
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export function PolicyIndexBadge({ status }: { status: IndexStatus }) {
  switch (status) {
    case "READY":
      return (
        <Badge variant="success" dot>
          RETRIEVAL: READY
        </Badge>
      );
    case "PROCESSING":
      return (
        <Badge variant="warning" dot>
          RETRIEVAL: PROCESSING
        </Badge>
      );
    case "FAILED":
      return (
        <Badge variant="destructive" dot>
          RETRIEVAL: FAILED
        </Badge>
      );
    case "NOT_STARTED":
      return (
        <Badge variant="outline" dot>
          RETRIEVAL: NOT STARTED
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}
