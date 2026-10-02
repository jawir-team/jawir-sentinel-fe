"use client";

import * as React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AppHeaderProps {
  userSection?: React.ReactNode;
  className?: string;
}

export function AppHeader({ userSection, className }: AppHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur transition-all",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 font-bold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-md p-1"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <span className="text-lg tracking-tight">JAWIR Sentinel</span>
        </Link>
        <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-blue-700 uppercase border border-blue-100">
          Gov-Workflow
        </span>
      </div>

      <div className="flex items-center gap-4">
        {userSection}
      </div>
    </header>
  );
}
