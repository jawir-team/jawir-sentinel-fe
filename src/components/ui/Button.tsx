import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "destructive"
    | "ghost"
    | "link";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      type = "button",
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none";

    const variantStyles = {
      primary:
        "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600 shadow-sm",
      secondary:
        "bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:ring-slate-400",
      outline:
        "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-blue-500 shadow-sm",
      destructive:
        "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600 shadow-sm",
      ghost:
        "text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-400",
      link: "text-blue-600 underline-offset-4 hover:underline focus-visible:ring-blue-500 p-0 h-auto",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-9 px-4 text-sm gap-2",
      lg: "h-11 px-6 text-base gap-2.5",
    };

    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          baseStyles,
          variantStyles[variant],
          variant !== "link" && sizeStyles[size],
          className
        )}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading && (
          <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
