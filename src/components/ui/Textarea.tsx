import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, hasError, disabled, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:border-transparent disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-75",
          hasError &&
            "border-red-500 focus-visible:ring-red-500 text-red-900 placeholder:text-red-300",
          className
        )}
        ref={ref}
        disabled={disabled}
        aria-invalid={hasError ? "true" : undefined}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
