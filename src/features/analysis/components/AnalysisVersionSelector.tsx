"use client";

import * as React from "react";
import { AnalysisSummaryItem } from "@/types/analysis";
import { Badge } from "@/components/ui/Badge";
import { History, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";

interface AnalysisVersionSelectorProps {
  analyses: AnalysisSummaryItem[];
  currentAnalysisId?: string | null;
  selectedAnalysisId: string;
  onSelectAnalysis: (analysisId: string) => void;
}

export function AnalysisVersionSelector({
  analyses,
  currentAnalysisId,
  selectedAnalysisId,
  onSelectAnalysis,
}: AnalysisVersionSelectorProps) {
  if (!analyses || analyses.length === 0) return null;

  // Sort versions descending so latest is easily accessible
  const sortedAnalyses = [...analyses].sort((a, b) => b.version - a.version);
  const highestVersion = Math.max(...analyses.map((a) => a.version));

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2 shadow-xs">
      <div className="flex items-center justify-between text-xs text-slate-500 font-medium pb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5 text-slate-700">
          <History className="h-4 w-4 text-blue-600" />
          <span>Versi Percobaan Analisis ({analyses.length} attempt tercatat)</span>
        </div>
        <span className="text-[11px] text-slate-400">
          Pilih attempt untuk melihat detail rekam jejak
        </span>
      </div>

      <div className="flex flex-wrap gap-2 pt-1" role="tablist" aria-label="Analysis versions">
        {sortedAnalyses.map((item) => {
          const isSelected = item.id === selectedAnalysisId;
          const isCurrent = item.id === currentAnalysisId;
          const isLatest = item.version === highestVersion;

          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => onSelectAnalysis(item.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium border transition-all text-left ${
                isSelected
                  ? "bg-blue-50 border-blue-600 text-blue-900 shadow-xs ring-1 ring-blue-600"
                  : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-sm">v{item.version}</span>
                {item.status === "COMPLETED" ? (
                  <CheckCircle2
                    className={`h-3.5 w-3.5 ${
                      isSelected ? "text-blue-600" : "text-emerald-600"
                    }`}
                  />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                )}
              </div>

              {/* Status & Verification Badges */}
              <div className="flex items-center gap-1">
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                    item.status === "COMPLETED"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {item.status}
                </span>

                {item.verification_status && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      item.verification_status === "PASS"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : item.verification_status === "PASS_WITH_WARNING"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {item.verification_status}
                  </span>
                )}

                {/* CURRENT badge */}
                {isCurrent && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white shadow-xs">
                    CURRENT
                  </span>
                )}

                {/* LATEST ATTEMPT badge when different from current */}
                {isLatest && !isCurrent && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-800">
                    LATEST ATTEMPT
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
