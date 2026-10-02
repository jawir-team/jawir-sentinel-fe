"use client";

import * as React from "react";
import { CheckerStatusData } from "@/types/review";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { CheckCircle2, XCircle, Clock, Users, ShieldCheck, Info } from "lucide-react";

interface CheckerStatusCardProps {
  statusData: CheckerStatusData;
  isChecking: boolean;
}

export function CheckerStatusCard({
  statusData,
  isChecking,
}: CheckerStatusCardProps) {
  const { required, approved, rejected, pending, checkers } = statusData;

  const percentComplete =
    required > 0 ? Math.min(100, Math.round((approved / required) * 100)) : 100;

  const isQuorumMet = approved >= required;

  return (
    <Card className="border-slate-200 shadow-sm" data-testid="checker-status-card">
      <CardHeader className="pb-3 border-b border-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900">
            <Users className="h-4 w-4 text-blue-600" />
            <span>Status Verifikasi Checker (Round Saat Ini)</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-mono">
              Analisis: {statusData.analysis_id}
            </span>
            {isQuorumMet ? (
              <Badge variant="success" className="gap-1 text-[11px]">
                <CheckCircle2 className="h-3 w-3" />
                <span>KORUM TERCAPAI</span>
              </Badge>
            ) : (
              <Badge variant="warning" className="gap-1 text-[11px]">
                <Clock className="h-3 w-3" />
                <span>MENUNGGU PERSETUJUAN</span>
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4 text-xs">
        {/* Progress Bar & Summary */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">
              Progres Checker Wajib (Required):
            </span>
            <span className="font-mono font-bold text-slate-900">
              {approved} dari {required} disetujui ({percentComplete}%)
            </span>
          </div>

          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div
              className={`h-full transition-all duration-500 ${
                isQuorumMet ? "bg-emerald-600" : "bg-blue-600"
              }`}
              style={{ width: `${percentComplete}%` }}
            />
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Disetujui: {approved}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span>Ditolak: {rejected}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span>Menunggu: {pending}</span>
            </span>
          </div>
        </div>

        {/* Checkers List */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
            Daftar Checker Terdaftar:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {checkers.map((chk) => {
              const isApproved = chk.status === "APPROVED";
              const isRejected = chk.status === "REJECTED";
              const isPending = chk.status === "PENDING";

              return (
                <div
                  key={chk.user_id}
                  className={`p-3 rounded-lg border flex items-center justify-between transition-colors ${
                    isApproved
                      ? "bg-emerald-50/50 border-emerald-200 text-emerald-950"
                      : isRejected
                      ? "bg-rose-50/50 border-rose-200 text-rose-950"
                      : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 font-medium">
                      <span>{chk.name}</span>
                      {chk.required ? (
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 border border-blue-200">
                          REQUIRED
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-600">
                          OPTIONAL
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      ID: {chk.user_id}
                    </span>
                  </div>

                  <div>
                    {isApproved && (
                      <Badge variant="success" className="gap-1 font-semibold text-[10px]">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>APPROVED</span>
                      </Badge>
                    )}
                    {isRejected && (
                      <Badge variant="destructive" className="gap-1 font-semibold text-[10px]">
                        <XCircle className="h-3 w-3" />
                        <span>REJECTED</span>
                      </Badge>
                    )}
                    {isPending && (
                      <Badge variant="outline" className="gap-1 text-slate-500 font-medium text-[10px]">
                        <Clock className="h-3 w-3 text-amber-500" />
                        <span>PENDING</span>
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Governance note */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-2 text-slate-600 text-[11px] leading-relaxed">
          <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
          <p>
            Hanya persetujuan dari <strong>Checker Wajib (Required)</strong> yang menjadi prasyarat pembukaan tahap Otorisasi Signer (SIGNING). Checker opsional yang berstatus pending tidak menghambat transisi jika seluruh Checker wajib telah menyetujui.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
