import * as React from "react";
import { Badge } from "@/components/ui/Badge";
import { PolicyVersionStatus, IndexStatus } from "@/types/policy";

export function PolicyAuthorityBadge({ status }: { status: PolicyVersionStatus }) {
  switch (status) {
    case "ACTIVE":
      return (
        <Badge variant="success" dot>
          AUTHORITATIVE ACTIVE
        </Badge>
      );
    case "DRAFT":
      return (
        <Badge variant="outline" dot>
          DRAFT VERSION
        </Badge>
      );
    case "SUPERSEDED":
      return (
        <Badge variant="secondary" dot>
          SUPERSEDED
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
          INDEX: READY
        </Badge>
      );
    case "PROCESSING":
      return (
        <Badge variant="warning" dot>
          INDEX: PROCESSING
        </Badge>
      );
    case "FAILED":
      return (
        <Badge variant="destructive" dot>
          INDEX: FAILED
        </Badge>
      );
    case "NOT_STARTED":
      return (
        <Badge variant="outline" dot>
          INDEX: NOT STARTED
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}
