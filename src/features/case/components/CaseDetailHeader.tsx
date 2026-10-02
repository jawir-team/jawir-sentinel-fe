"use client";

import * as React from "react";
import { CaseDetail } from "@/types/case";
import { CaseStatusBadge, UrgencyBadge } from "./StatusBadges";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Textarea } from "@/components/ui/Textarea";
import { FormField } from "@/components/ui/FormField";
import { Alert } from "@/components/ui/Alert";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { closeCase } from "@/services/api/cases";
import { queryKeys } from "@/constants/queryKeys";
import { XCircle, Lock } from "lucide-react";

export interface CaseDetailHeaderProps {
  caseData: CaseDetail;
  isParticipant?: boolean;
}

export function CaseDetailHeader({
  caseData,
  isParticipant = true,
}: CaseDetailHeaderProps) {
  const queryClient = useQueryClient();
  const [isCloseOpen, setIsCloseOpen] = React.useState(false);
  const [closeReason, setCloseReason] = React.useState("");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const isTerminal = caseData.status === "DONE" || caseData.status === "CLOSED";
  const isGeneratingOrInProgress = caseData.status === "AI_ANALYSIS";

  const closeMutation = useMutation({
    mutationFn: (reason: string) => closeCase(caseData.id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.case(caseData.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cases() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
      setIsCloseOpen(false);
      setCloseReason("");
    },
    onError: (err: unknown) => {
      // Refetch authoritative state
      queryClient.invalidateQueries({ queryKey: queryKeys.case(caseData.id) });
      const msg =
        err instanceof Error
          ? err.message
          : "Gagal menutup case. Pastikan tidak ada analisis atau eksekusi yang sedang aktif.";
      setErrorMsg(msg);
    },
  });

  const handleCloseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!closeReason.trim()) {
      setErrorMsg("Alasan penutupan case wajib diisi.");
      return;
    }
    setErrorMsg(null);
    closeMutation.mutate(closeReason.trim());
  };

  return (
    <div className="mb-6 space-y-3 border-b border-slate-200 pb-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
            <span className="font-mono text-sm font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
              {caseData.case_number}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {caseData.case_type?.name}
            </span>
            <UrgencyBadge urgency={caseData.urgency} />
            <CaseStatusBadge status={caseData.status} />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {caseData.title}
          </h1>

          <p className="mt-1 text-xs text-slate-500 font-mono">
            Dibuat oleh: <span className="font-medium text-slate-700">{caseData.maker?.name}</span> •{" "}
            {new Date(caseData.created_at).toLocaleString("id-ID", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {!isTerminal && isParticipant && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setErrorMsg(null);
                setCloseReason("");
                setIsCloseOpen(true);
              }}
              disabled={isGeneratingOrInProgress}
              className="text-red-700 border-red-200 hover:bg-red-50 hover:border-red-300"
            >
              <XCircle className="h-4 w-4 mr-1.5 text-red-600" aria-hidden="true" />
              Tutup Kasus (Close)
            </Button>
          )}

          {isTerminal && (
            <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-slate-100 text-slate-600 rounded-md border border-slate-200">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              Case Selesai / Ditutup (Read-Only)
            </div>
          )}
        </div>
      </div>

      {/* Dialog Close Case */}
      <Dialog
        isOpen={isCloseOpen}
        onClose={() => setIsCloseOpen(false)}
        title={`Tutup Kasus: ${caseData.case_number}`}
        description="Penutupan case memerlukan alasan yang jelas dan dapat diaudit. Tindakan ini akan mengakhiri alur kerja kasus."
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setIsCloseOpen(false)}
              disabled={closeMutation.isPending}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleCloseSubmit}
              isLoading={closeMutation.isPending}
            >
              Konfirmasi Tutup Case
            </Button>
          </>
        }
      >
        <form onSubmit={handleCloseSubmit} className="space-y-4">
          {errorMsg && (
            <Alert variant="destructive" title="Gagal Menutup Case">
              {errorMsg}
            </Alert>
          )}

          <FormField
            label="Alasan Penutupan (Wajib Diisi)"
            id="close-reason"
            required
            hint="Contoh: Telah diselesaikan di sistem legacy, insiden duplikat, atau dibatalkan oleh Maker."
          >
            <Textarea
              id="close-reason"
              placeholder="Tuliskan justifikasi operasional..."
              value={closeReason}
              onChange={(e) => setCloseReason(e.target.value)}
              disabled={closeMutation.isPending}
              rows={4}
            />
          </FormField>
        </form>
      </Dialog>
    </div>
  );
}
