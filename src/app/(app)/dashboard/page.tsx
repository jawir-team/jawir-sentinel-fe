"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { ContentContainer } from "@/components/layout/ContentContainer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/feedback/ErrorState";
import { getDashboardSummary } from "@/services/api/dashboard";
import { queryKeys } from "@/constants/queryKeys";
import { CaseStatus } from "@/types/case";
import {
  FileText,
  CheckSquare,
  ShieldCheck,
  PlayCircle,
  Clock,
  Sparkles,
  CheckCircle2,
  Lock,
  AlertOctagon,
  ArrowRight,
  Info,
} from "lucide-react";

export default function DashboardPage() {
  const {
    data: summary,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.dashboard(),
    queryFn: getDashboardSummary,
  });

  const personaCards = [
    {
      title: "My Cases",
      count: summary?.my_cases ?? 0,
      description: "Cases you initiated or where you are an assigned participant",
      href: "/cases",
      icon: FileText,
      color: "blue",
      borderClass: "border-blue-200 hover:border-blue-400",
      bgClass: "bg-blue-50 text-blue-700",
    },
    {
      title: "Needs Checker Review",
      count: summary?.need_my_review ?? 0,
      description: "CHECKING cases awaiting your verification",
      href: "/cases?status=CHECKING",
      icon: CheckSquare,
      color: "amber",
      borderClass: "border-amber-200 hover:border-amber-400",
      bgClass: "bg-amber-50 text-amber-700",
    },
    {
      title: "Needs Signer Authorization",
      count: summary?.need_my_signature ?? 0,
      description: "SIGNING cases awaiting your authorization",
      href: "/cases?status=SIGNING",
      icon: ShieldCheck,
      color: "purple",
      borderClass: "border-purple-200 hover:border-purple-400",
      bgClass: "bg-purple-50 text-purple-700",
    },
    {
      title: "Needs Execution",
      count: summary?.need_my_execution ?? 0,
      description: "EXECUTION cases ready to be executed and resolved",
      href: "/cases?status=EXECUTION",
      icon: PlayCircle,
      color: "emerald",
      borderClass: "border-emerald-200 hover:border-emerald-400",
      bgClass: "bg-emerald-50 text-emerald-700",
    },
  ];

  const statusConfigs: {
    status: CaseStatus;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    variant: "default" | "secondary" | "success" | "warning" | "destructive" | "outline";
  }[] = [
    { status: "DRAFT", label: "Draft", icon: FileText, variant: "secondary" },
    { status: "AI_ANALYSIS", label: "AI Analysis", icon: Sparkles, variant: "secondary" },
    { status: "CHECKING", label: "Checker Review", icon: Clock, variant: "warning" },
    { status: "SIGNING", label: "Signer Authorization", icon: ShieldCheck, variant: "warning" },
    { status: "EXECUTION", label: "In Execution", icon: PlayCircle, variant: "default" },
    { status: "DONE", label: "Completed (DONE)", icon: CheckCircle2, variant: "success" },
    { status: "CLOSED", label: "Closed (CLOSED)", icon: Lock, variant: "outline" },
    { status: "ESCALATION_REQUIRED", label: "Escalation Required", icon: AlertOctagon, variant: "destructive" },
  ];

  return (
    <ContentContainer>
      <PageHeader
        title="Operational Summary Dashboard"
        description="Monitor approval action queues and case status distribution across the JAWIR Sentinel platform."
      />

      {isError ? (
        <ErrorState
          title="Failed to Load Dashboard Summary"
          message="There was an issue retrieving summary data from the server. Please try again."
          onRetry={() => refetch()}
        />
      ) : isLoading ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Persona Action Queue Cards */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
              Your Action Queue
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {personaCards.map((card) => {
                const Icon = card.icon;
                return (
                  <Link
                    key={card.title}
                    href={card.href}
                    className={`block p-5 rounded-lg border bg-white shadow-xs transition-all hover:shadow-md ${card.borderClass} group`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`p-2.5 rounded-lg ${card.bgClass}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-2xl font-bold font-mono text-slate-900">
                        {card.count}
                      </span>
                    </div>

                    <div className="mt-3">
                      <h3 className="font-semibold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                        {card.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {card.description}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center text-xs font-medium text-blue-600 group-hover:translate-x-1 transition-transform">
                      <span>View Cases</span>
                      <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Status Breakdown Grid */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
              Case Status Distribution
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {statusConfigs.map((cfg) => {
                const Icon = cfg.icon;
                const count = summary?.status_counts[cfg.status] ?? 0;
                return (
                  <Link
                    key={cfg.status}
                    href={`/cases?status=${cfg.status}`}
                    className="p-4 rounded-lg border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant={cfg.variant} className="text-[10px] font-mono">
                        {cfg.status}
                      </Badge>
                      <Icon className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
                    </div>
                    <div className="mt-3">
                      <span className="text-xl font-bold font-mono text-slate-900 block">
                        {count}
                      </span>
                      <span className="text-xs text-slate-500 mt-0.5 block">
                        {cfg.label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Governance Information Notice */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3 text-slate-600 text-xs leading-relaxed">
            <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800">
                Sentinel Governance Integrity
              </p>
              <p className="text-slate-600 mt-0.5">
                The queue counts above are computed authoritatively by the Sentinel server based on your account&apos;s Segregation of Duties assignments. The ADMIN role provides oversight visibility without improperly bypassing case action authority.
              </p>
            </div>
          </div>
        </div>
      )}
    </ContentContainer>
  );
}
