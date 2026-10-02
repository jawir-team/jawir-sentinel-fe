"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  BookOpen,
  Users,
  Building2,
  FileSpreadsheet,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface AppSidebarProps {
  isAdmin?: boolean;
  className?: string;
}

export function AppSidebar({ isAdmin = true, className }: AppSidebarProps) {
  const pathname = usePathname();

  const mainNav = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      name: "Cases",
      href: "/cases",
      icon: Briefcase,
      active: pathname.startsWith("/cases"),
    },
  ];

  const adminNav = [
    {
      name: "Policies",
      href: "/policies",
      icon: BookOpen,
      active: pathname.startsWith("/policies"),
    },
    {
      name: "Users",
      href: "/users",
      icon: Users,
      active: pathname.startsWith("/users"),
    },
    {
      name: "Units",
      href: "/units",
      icon: Building2,
      active: pathname.startsWith("/units"),
    },
    {
      name: "Case Types",
      href: "/case-types",
      icon: FileSpreadsheet,
      active: pathname.startsWith("/case-types"),
    },
  ];

  return (
    <aside
      className={cn(
        "flex w-64 flex-col border-r border-slate-200 bg-white min-h-[calc(100vh-4rem)] p-4",
        className
      )}
      aria-label="Sidebar navigation"
    >
      <nav className="flex-1 space-y-6">
        <div>
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Main
          </p>
          <ul className="space-y-1">
            {mainNav.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600",
                      item.active
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                    aria-current={item.active ? "page" : undefined}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        item.active ? "text-blue-600" : "text-slate-400"
                      )}
                      aria-hidden="true"
                    />
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {isAdmin && (
          <div>
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Administration
            </p>
            <ul className="space-y-1">
              {adminNav.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600",
                        item.active
                          ? "bg-blue-50 text-blue-700 font-semibold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                      aria-current={item.active ? "page" : undefined}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          item.active ? "text-blue-600" : "text-slate-400"
                        )}
                        aria-hidden="true"
                      />
                      <span>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </nav>
    </aside>
  );
}
