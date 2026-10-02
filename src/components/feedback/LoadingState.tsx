import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoadingStateProps {
  label?: string;
  className?: string;
}

export function LoadingState({
  label = "Loading data...",
  className,
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center",
        className
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" aria-hidden="true" />
      <span className="text-sm font-medium text-slate-600">{label}</span>
    </div>
  );
}
