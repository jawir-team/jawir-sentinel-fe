"use client";

import * as React from "react";
import {
  AnalysisDetail,
  VerificationStatus,
  AnalysisStatus,
} from "@/types/analysis";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import {
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileText,
  HelpCircle,
  CheckCircle2,
  XCircle,
  BookOpen,
  Paperclip,
  ArrowRight,
  TrendingUp,
  AlertOctagon,
  Search,
} from "lucide-react";

interface AnalysisDetailViewProps {
  analysis: AnalysisDetail;
  isCurrent?: boolean;
  onOpenPolicyRef?: (ref: NonNullable<AnalysisDetail["policy_references"]>[0]) => void;
  onOpenEvidenceRef?: (evidenceId: string) => void;
}

export function AnalysisDetailView({
  analysis,
  isCurrent,
  onOpenPolicyRef,
  onOpenEvidenceRef,
}: AnalysisDetailViewProps) {
  const getStatusBadge = (status: AnalysisStatus) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge variant="success" className="gap-1.5 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>COMPLETED</span>
          </Badge>
        );
      case "FAILED":
        return (
          <Badge variant="destructive" className="gap-1.5 font-medium">
            <XCircle className="h-3.5 w-3.5" />
            <span>FAILED</span>
          </Badge>
        );
      case "GENERATING":
        return (
          <Badge variant="warning" className="gap-1.5 font-medium animate-pulse">
            <Sparkles className="h-3.5 w-3.5" />
            <span>GENERATING</span>
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getVerificationBadge = (vStatus?: VerificationStatus | null) => {
    if (!vStatus) return null;
    switch (vStatus) {
      case "PASS":
        return (
          <Badge variant="success" className="gap-1.5 font-medium">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>VERIFIED: PASS</span>
          </Badge>
        );
      case "PASS_WITH_WARNING":
        return (
          <Badge variant="warning" className="gap-1.5 font-medium">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>VERIFIED: PASS WITH WARNING</span>
          </Badge>
        );
      case "FAIL":
        return (
          <Badge variant="destructive" className="gap-1.5 font-medium">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>VERIFIED: FAIL</span>
          </Badge>
        );
      default:
        return <Badge variant="secondary">{vStatus}</Badge>;
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case "CRITICAL":
        return <Badge variant="destructive">CRITICAL</Badge>;
      case "HIGH":
        return <Badge variant="warning">HIGH</Badge>;
      case "MEDIUM":
        return <Badge variant="secondary">MEDIUM</Badge>;
      default:
        return <Badge variant="outline">LOW</Badge>;
    }
  };

  const getComplianceBadge = (status?: string | null) => {
    if (!status) return null;
    switch (status) {
      case "COMPLIANT":
        return <Badge variant="success">COMPLIANT</Badge>;
      case "REQUIRES_REVIEW":
        return <Badge variant="warning">REQUIRES REVIEW</Badge>;
      case "NON_COMPLIANT":
        return <Badge variant="destructive">NON COMPLIANT</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6" data-testid="analysis-detail-view">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900 text-sm">
                Analisis Version #{analysis.version}
              </h3>
              {isCurrent && (
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                  CURRENT
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-mono">
              ID: {analysis.id} &bull; Dihasilkan:{" "}
              {new Date(analysis.created_at).toLocaleString("id-ID")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {getStatusBadge(analysis.status)}
          {getVerificationBadge(analysis.verification?.status)}
        </div>
      </div>

      {/* Verification Issues & Failure Reasons */}
      {analysis.status === "FAILED" && (
        <Alert variant="destructive" title="Analisis Gagal / Ditolak Verifier">
          {analysis.failure_reason ||
            "Proses verifikasi atau inferensi AI gagal menghasilkan output yang valid sesuai kebijakan."}
        </Alert>
      )}

      {analysis.verification?.issues && analysis.verification.issues.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span>Catatan Verifikasi Model ({analysis.verification.issues.length} temuan)</span>
          </div>
          <ul className="space-y-1.5 pl-6 text-xs text-amber-900 list-disc">
            {analysis.verification.issues.map((issue, idx) => (
              <li key={idx}>
                <span className="font-mono font-medium uppercase text-amber-950">
                  [{issue.rule}]
                </span>{" "}
                {issue.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Ringkasan Eksekutif */}
      {analysis.summary !== null && analysis.summary !== undefined && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900">
              <FileText className="h-4 w-4 text-blue-600" />
              <span>Ringkasan Eksekutif Analisis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {analysis.summary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Fakta, Asumsi, & Ketidaktahuan (Unknowns) */}
      {((analysis.facts && analysis.facts.length > 0) ||
        (analysis.assumptions && analysis.assumptions.length > 0) ||
        (analysis.unknowns && analysis.unknowns.length > 0)) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Fakta Teridentifikasi */}
          {analysis.facts && analysis.facts.length > 0 && (
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Fakta Teridentifikasi</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                {analysis.facts.map((fact, idx) => (
                  <div key={idx} className="p-2.5 rounded bg-slate-50 border border-slate-100">
                    <p className="text-slate-800 leading-snug">{fact.statement}</p>
                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                      <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold">
                        {fact.source_type}
                      </span>
                      {fact.source_ref && (
                        <span>ref: {fact.source_ref}</span>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Asumsi */}
          {analysis.assumptions && analysis.assumptions.length > 0 && (
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
                  <span>Asumsi Model</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                {analysis.assumptions.map((assumption, idx) => (
                  <div key={idx} className="p-2.5 rounded bg-slate-50 border border-slate-100">
                    <p className="text-slate-700 leading-snug">&bull; {assumption}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Unknowns / Ketidaktahuan */}
          {analysis.unknowns && analysis.unknowns.length > 0 && (
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                  <HelpCircle className="h-3.5 w-3.5 text-amber-600" />
                  <span>Informasi Belum Diketahui</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                {analysis.unknowns.map((unk, idx) => (
                  <div key={idx} className="p-2.5 rounded bg-amber-50/50 border border-amber-100">
                    <p className="font-medium text-slate-900 leading-snug">{unk.item}</p>
                    <p className="text-slate-600 text-[11px] mt-1">
                      <span className="font-semibold text-slate-700">Dampak:</span> {unk.impact}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Risiko & Analisis Kepatuhan */}
      {((analysis.risk_analysis && analysis.risk_analysis.length > 0) ||
        analysis.compliance_analysis ||
        analysis.policy_status) && (
        <Card className="border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900">
                <AlertOctagon className="h-4 w-4 text-amber-600" />
                <span>Analisis Risiko & Kepatuhan Kebijakan</span>
              </CardTitle>
              {analysis.policy_status && (
                <Badge variant="outline" className="font-mono text-xs">
                  {analysis.policy_status}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {/* Kepatuhan */}
            {analysis.compliance_analysis && (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-700">
                    Status Kepatuhan Terhadap Kebijakan Terkait
                  </span>
                  {getComplianceBadge(analysis.compliance_analysis.status)}
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {analysis.compliance_analysis.reason}
                </p>
              </div>
            )}

            {/* Risiko Teridentifikasi */}
            {analysis.risk_analysis && analysis.risk_analysis.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-700 block">
                  Daftar Risiko Operasional & Finansial
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {analysis.risk_analysis.map((risk, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-slate-200 bg-white space-y-1.5 text-xs shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 font-mono">
                          {risk.type}
                        </span>
                        {getRiskBadge(risk.level)}
                      </div>
                      <p className="text-slate-600 leading-relaxed">{risk.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Rekomendasi AI & Rencana Aksi */}
      {analysis.recommendation && (
        <Card className="border-blue-200 bg-blue-50/20 shadow-sm">
          <CardHeader className="pb-3 border-b border-blue-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-blue-900">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                <span>Rekomendasi Tindakan Sentinel</span>
              </CardTitle>
              <Badge variant="secondary" className="font-mono text-[11px]">
                {analysis.recommendation.type}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            <p className="text-sm font-medium text-slate-900 leading-relaxed">
              {analysis.recommendation.summary}
            </p>

            {/* Langkah Aksi Terurut */}
            {analysis.recommendation.actions &&
              analysis.recommendation.actions.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="font-bold uppercase tracking-wider text-slate-600 text-[11px] block">
                    Urutan Langkah Penanganan (Action Items):
                  </span>
                  <div className="space-y-2">
                    {analysis.recommendation.actions.map((act) => (
                      <div
                        key={act.order}
                        className="flex items-start gap-3 p-3 rounded-lg bg-white border border-blue-100"
                      >
                        <div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          {act.order}
                        </div>
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-900">{act.action}</p>
                          <p className="text-slate-600">{act.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Manfaat & Risiko Potensial */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {analysis.recommendation.potential_benefits &&
                analysis.recommendation.potential_benefits.length > 0 && (
                  <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-100 space-y-1.5">
                    <span className="font-semibold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Manfaat Potensial</span>
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-emerald-950">
                      {analysis.recommendation.potential_benefits.map((b, idx) => (
                        <li key={idx}>{b}</li>
                      ))}
                    </ul>
                  </div>
                )}

              {analysis.recommendation.potential_risks &&
                analysis.recommendation.potential_risks.length > 0 && (
                  <div className="p-3 rounded-lg bg-rose-50/70 border border-rose-100 space-y-1.5">
                    <span className="font-semibold text-rose-900 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                      <span>Risiko Residu Potensial</span>
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-rose-950">
                      {analysis.recommendation.potential_risks.map((r, idx) => (
                        <li key={idx}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>

            {/* Alternatif lain jika ada */}
            {analysis.alternatives && analysis.alternatives.length > 0 && (
              <div className="pt-2">
                <span className="font-semibold text-slate-700 block mb-1">
                  Opsi Alternatif yang Dipertimbangkan:
                </span>
                <ul className="list-disc pl-5 text-slate-600 space-y-0.5">
                  {analysis.alternatives.map((alt, idx) => (
                    <li key={idx}>{alt}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Kualitas Bukti & Ketidakpastian */}
      {(analysis.evidence_quality || analysis.uncertainty) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {analysis.evidence_quality && (
            <div className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Kualitas Bukti Pendukung:</span>
              <Badge variant="secondary" className="font-semibold">
                {analysis.evidence_quality}
              </Badge>
            </div>
          )}
          {analysis.uncertainty && (
            <div className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Tingkat Ketidakpastian (Uncertainty):</span>
              <Badge variant="outline" className="font-semibold">
                {analysis.uncertainty}
              </Badge>
            </div>
          )}
        </div>
      )}

      {/* Policy & Evidence Provenance (FE-016 & FE-018) */}
      {((analysis.policy_references && analysis.policy_references.length > 0) ||
        (analysis.evidence_references && analysis.evidence_references.length > 0)) && (
        <Card className="border-slate-200" data-testid="provenance-section">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900">
              <BookOpen className="h-4 w-4 text-indigo-600" />
              <span>Sumber Kebijakan & Bukti Dokumen Terkait (Provenance)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {/* Policy References */}
            {analysis.policy_references && analysis.policy_references.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                  Klausa Kebijakan yang Dikutip:
                </span>
                <div className="space-y-2">
                  {analysis.policy_references.map((pref, idx) => (
                    <div
                      key={idx}
                      onClick={() => onOpenPolicyRef?.(pref)}
                      className={`p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1 text-xs transition-colors ${
                        onOpenPolicyRef ? "hover:border-indigo-300 hover:bg-indigo-50/30 cursor-pointer" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-indigo-700">
                            {pref.policy_code}
                          </span>
                          <span className="font-medium text-slate-800">
                            {pref.policy_title}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-mono">
                            v{pref.version}
                          </span>
                        </div>
                        {pref.section && (
                          <span className="text-[11px] text-slate-500 font-mono">
                            {pref.section}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 italic bg-white p-2 rounded border border-slate-100 mt-1">
                        &ldquo;{pref.excerpt}&rdquo;
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Evidence References */}
            {analysis.evidence_references && analysis.evidence_references.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                  Bukti yang Digunakan (Evidence References):
                </span>
                <div className="flex flex-wrap gap-2">
                  {analysis.evidence_references.map((eref, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onOpenEvidenceRef?.(eref.evidence_id)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs hover:border-slate-300 text-slate-700 font-mono"
                    >
                      <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                      <span>{eref.evidence_id}</span>
                      <span className="text-[10px] font-sans px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                        {eref.usage_type}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
