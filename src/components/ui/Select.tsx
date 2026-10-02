import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, hasError, disabled, ...props }, ref) => {
    return (
      <select
        className={cn(
          "flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:border-transparent disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-75",
          hasError && "border-red-500 focus-visible:ring-red-500 text-red-900",
          className
        )}
        ref={ref}
        disabled={disabled}
        aria-invalid={hasError ? "true" : undefined}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = "Select";
