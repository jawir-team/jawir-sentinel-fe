import * as React from "react";
import { AlertCircle, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "success" | "warning" | "destructive";
  title?: string;
}

export function Alert({
  className,
  variant = "info",
  title,
  children,
  ...props
}: AlertProps) {
  const variantStyles = {
    info: "bg-blue-50 border-blue-200 text-blue-900",
    success: "bg-emerald-50 border-emerald-200 text-emerald-900",
    warning: "bg-amber-50 border-amber-200 text-amber-900",
    destructive: "bg-rose-50 border-rose-200 text-rose-900",
  };

  const icons = {
    info: <Info className="h-5 w-5 text-blue-600 shrink-0" aria-hidden="true" />,
    success: <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" aria-hidden="true" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" aria-hidden="true" />,
    destructive: <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" aria-hidden="true" />,
  };

  const role = variant === "destructive" || variant === "warning" ? "alert" : "status";

  return (
    <div
      role={role}
      className={cn(
        "relative w-full rounded-lg border p-4 flex gap-3 text-sm",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      <div className="mt-0.5">{icons[variant]}</div>
      <div className="flex-1">
        {title && <h5 className="font-semibold leading-tight mb-1">{title}</h5>}
        <div className="text-sm opacity-90">{children}</div>
      </div>
    </div>
  );
}
