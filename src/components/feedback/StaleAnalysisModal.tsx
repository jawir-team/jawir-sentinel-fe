"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";

interface StaleAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
}

export function StaleAnalysisModal({
  isOpen,
  onClose,
  caseId,
}: StaleAnalysisModalProps) {
  const queryClient = useQueryClient();

  const handleRefreshAndClose = () => {
    // Invalidate and refetch all authoritative queries
    queryClient.invalidateQueries({ queryKey: queryKeys.case(caseId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.cases() });
    queryClient.invalidateQueries({ queryKey: queryKeys.analyses(caseId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.analysisCurrent(caseId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.checkerStatus(caseId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.history(caseId) });
    queryClient.invalidateQueries({ queryKey: ["executions", caseId] });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });

    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleRefreshAndClose}
      title="Konflik Versi Analisis (STALE_ANALYSIS)"
      description="Hasil analisis atau konteks alur kerja kasus telah berubah sebelum keputusan Anda diproses."
      footer={
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleRefreshAndClose}
          className="gap-1.5"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Muat Ulang & Tinjau Analisis Terkini</span>
        </Button>
      }
    >
      <div className="space-y-4 text-xs">
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3 text-amber-950">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-sm">
              Keputusan Anda Tidak Diterapkan
            </p>
            <p className="text-[11px] leading-relaxed text-amber-900">
              Sistem backend menolak aksi review/otorisasi Anda (kode: <code>409 STALE_ANALYSIS</code>) karena versi analisis yang Anda lihat telah digantikan oleh analisis baru atau status kasus telah mengalami transisi.
            </p>
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-slate-700">
          <span className="font-semibold text-slate-900 block">
            Prinsip Tata Kelola Integritas (Governance Safety):
          </span>
          <ul className="list-disc pl-5 space-y-1 text-[11px]">
            <li>Sistem <strong>tidak akan pernah</strong> mengulang atau menerapkan keputusan Anda secara otomatis ke versi analisis yang baru.</li>
            <li>Seluruh data versi kasus dan catatan verifikasi terkini akan disinkronkan kembali ke antarmuka Anda.</li>
            <li>Silakan periksa kembali klausul rekomendasi pada analisis terbaru sebelum memberikan persetujuan atau arahan baru.</li>
          </ul>
        </div>
      </div>
    </Dialog>
  );
}
