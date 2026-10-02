import * as React from "react";
import { cn } from "@/lib/utils";

export interface ContentContainerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function ContentContainer({
  className,
  children,
  ...props
}: ContentContainerProps) {
  return (
    <div
      className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6", className)}
      {...props}
    >
      {children}
    </div>
  );
}
