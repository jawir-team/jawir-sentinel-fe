"use client";

import * as React from "react";
import { AlertOctagon, HelpCircle, ShieldAlert, RefreshCw, Info } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

export type EscalationCause =
  | "VERIFIER_FAIL"
  | "TECHNICAL_RETRY_EXHAUSTED"
  | "REANALYSIS_LIMIT_REACHED"
  | "UNKNOWN";

interface EscalationNoticeProps {
  cause?: EscalationCause;
  failureReason?: string | null;
  versionCount?: number;
}

export function EscalationNotice({
  cause = "UNKNOWN",
  failureReason,
  versionCount = 1,
}: EscalationNoticeProps) {
  const getCauseDetails = () => {
    switch (cause) {
      case "VERIFIER_FAIL":
        return {
          title: "Kegagalan Verifikasi Integritas Model (VERIFIER_FAIL)",
          badge: "VERIFIER FAIL",
          explanation:
            "Hasil inferensi AI ditolak oleh verifier internal karena terdeteksi ketidaksesuaian kritis (seperti klausul kebijakan yang tidak valid/halusinasi atau referensi bukti yang tidak terdaftar).",
          actionAdvice:
            "Evaluasi bukti kasus dan catatan verifikasi. Penambahan bukti baru yang valid atau peninjauan manual kebijakan diperlukan.",
        };
      case "TECHNICAL_RETRY_EXHAUSTED":
        return {
          title: "Batas Percobaan Ulang Teknis Habis (TECHNICAL_RETRY_EXHAUSTED)",
          badge: "TECHNICAL RETRY EXHAUSTED",
          explanation:
            "Koneksi teknis atau inferensi ke penyedia model AI mengalami batas waktu (timeout) atau galat internal berulang, dan seluruh kuota retry teknis telah habis.",
          actionAdvice:
            "Periksa status konektivitas infrastruktur AI atau hubungi administrator sistem. Kasus tidak dapat diproses otomatis lebih lanjut.",
        };
      case "REANALYSIS_LIMIT_REACHED":
        return {
          title: "Batas Maksimal Re-analisis Tercapai (REANALYSIS_LIMIT_REACHED)",
          badge: "LIMIT REACHED (MAX 3 RE-ANALYSIS)",
          explanation: `Siklus re-analisis otomatis telah mencapai batas maksimum sistem (hingga percobaan versi ke-${versionCount}) akibat penolakan berulang pada tahap review atau kendala eksekusi.`,
          actionAdvice:
            "Sesuai tata kelola risiko Sentinel, kasus harus dialihkan untuk penanganan manual atau ditutup (Close Case) untuk dibuat ulang secara terpisah.",
        };
      default:
        return {
          title: "Eskalasi Diperlukan (Escalation Required)",
          badge: "ESCALATION REQUIRED",
          explanation:
            failureReason ||
            "Kasus membutuhkan intervensi operasional manual karena proses analisis otomatis tidak dapat dilanjutkan.",
          actionAdvice:
            "Tinjau detail riwayat kasus dan bukti dokumen yang tersedia untuk tindakan operasional berikutnya.",
        };
    }
  };

  const details = getCauseDetails();

  return (
    <Card className="border-rose-300 bg-rose-50/40 shadow-sm" data-testid="escalation-notice">
      <CardHeader className="pb-3 border-b border-rose-100">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-rose-950">
            <AlertOctagon className="h-5 w-5 text-rose-600 shrink-0" />
            <span>{details.title}</span>
          </CardTitle>
          <Badge variant="destructive" className="font-mono text-xs">
            {details.badge}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-3 text-xs">
        <div className="p-3 bg-white border border-rose-200 rounded-lg text-slate-800 leading-relaxed">
          <p className="font-medium text-rose-900 mb-1">Penyebab Eskalasi:</p>
          <p>{details.explanation}</p>
        </div>

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 leading-relaxed">
          <div className="flex items-center gap-1.5 font-semibold text-amber-950 mb-1">
            <Info className="h-4 w-4 text-amber-700 shrink-0" />
            <span>Panduan Tindakan Operasional:</span>
          </div>
          <p className="text-[11px]">{details.actionAdvice}</p>
          <p className="text-[11px] mt-2 font-mono text-amber-800">
            Catatan Tata Kelola: Pada MVP, tindakan Resume atau pemicuan re-analysis instan dinonaktifkan untuk menjaga integritas Segregation of Duties.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
