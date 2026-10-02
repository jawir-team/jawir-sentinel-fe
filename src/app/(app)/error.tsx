"use client";

import * as React from "react";
import { ErrorState } from "@/components/feedback/ErrorState";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Unhandled route error:", error);
  }, [error]);

  return (
    <div className="flex h-96 items-center justify-center p-6">
      <ErrorState
        title="An error occurred on this page"
        message={error.message || "Failed to process page data."}
        onRetry={reset}
      />
    </div>
  );
}
