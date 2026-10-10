import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", hasError, disabled, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:border-transparent disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-75",
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

Input.displayName = "Input";
