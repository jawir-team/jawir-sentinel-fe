"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { FormField } from "@/components/ui/FormField";
import { Alert } from "@/components/ui/Alert";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitSignerDecision } from "@/services/api/reviews";
import { queryKeys } from "@/constants/queryKeys";
import { ReviewDecision } from "@/types/review";
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck } from "lucide-react";

interface SignerDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  analysisId: string;
  decision: ReviewDecision;
  onSuccessDecision?: (nextStatus: string) => void;
  onStaleConflict?: () => void;
}

export function SignerDecisionModal({
  isOpen,
  onClose,
  caseId,
  analysisId,
  decision,
  onSuccessDecision,
  onStaleConflict,
}: SignerDecisionModalProps) {
  const queryClient = useQueryClient();
  const [reason, setReason] = React.useState("");
  const [comment, setComment] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const isReject = decision === "REJECT";

  React.useEffect(() => {
    if (isOpen) {
      setReason("");
      setComment("");
      setErrorMessage(null);
    }
  }, [isOpen]);

  const decisionMutation = useMutation({
    mutationFn: () =>
      submitSignerDecision(caseId, {
        analysis_id: analysisId,
        decision,
        reason: isReject ? reason.trim() : undefined,
        comment: comment.trim() || undefined,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.case(caseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cases() });
      queryClient.invalidateQueries({ queryKey: queryKeys.analyses(caseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.analysisCurrent(caseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.history(caseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });

      onSuccessDecision?.(data.case_status);
      onClose();
    },
    onError: (err: any) => {
      if (err?.status === 409 || err?.code === "STALE_ANALYSIS") {
        onStaleConflict?.();
        onClose();
        return;
      }
      const msg =
        err?.message ||
        "Gagal mengirimkan keputusan Signer. Silakan coba kembali.";
      setErrorMessage(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReject && !reason.trim()) {
      setErrorMessage("Alasan penolakan (reason) wajib diisi untuk dokumentasi tata kelola otorisasi.");
      return;
    }
    setErrorMessage(null);
    decisionMutation.mutate();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        isReject
          ? "Penolakan Otorisasi Eksekutif (Signer Reject)"
          : "Otorisasi Eksekutif Kasus (Signer Approve)"
      }
      description={
        isReject
          ? "Penolakan Signer akan memicu re-analisis otomatis (atau eskalasi jika batas kuota tercapai)."
          : "Persetujuan Signer mengotorisasi kasus ini untuk dieksekusi oleh Executer berwenang (Status: EXECUTION)."
      }
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={decisionMutation.isPending}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant={isReject ? "destructive" : "primary"}
            size="sm"
            onClick={handleSubmit}
            isLoading={decisionMutation.isPending}
          >
            {isReject ? "Konfirmasi Penolakan Signer" : "Konfirmasi Otorisasi (Approve)"}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {errorMessage && (
          <Alert variant="destructive" title="Kendala Pengiriman Otorisasi">
            {errorMessage}
          </Alert>
        )}

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
          <span className="text-[11px] text-slate-500 font-mono block">
            Analisis Target Otorisasi:
          </span>
          <span className="font-mono font-bold text-slate-900 text-xs">
            {analysisId}
          </span>
        </div>

        {isReject ? (
          <>
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-rose-900">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                <strong>Catatan Tata Kelola:</strong> Penolakan Signer menandakan ketidaksetujuan eksekutif terhadap rencana tindakan yang diusulkan. Alasan penolakan wajib dicatat.
              </p>
            </div>

            <FormField label="Alasan Penolakan Eksekutif (Wajib)" required>
              <Textarea
                rows={3}
                placeholder="Contoh: Dampak risiko operasional terlalu tinggi untuk window kliring saat ini..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </FormField>

            <FormField label="Catatan Tambahan (Opsional)">
              <Textarea
                rows={2}
                placeholder="Tambahkan alternatif arahan penanganan..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </FormField>
          </>
        ) : (
          <>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2 text-emerald-900">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                Dengan mengotorisasi kasus ini, Anda memberikan mandat penuh kepada Executer untuk menjalankan tindakan operasional sesuai rekomendasi analisis.
              </p>
            </div>

            <FormField label="Catatan Otorisasi Eksekutif (Opsional)">
              <Textarea
                rows={2}
                placeholder="Contoh: Disetujui untuk penanganan exception kliring batch..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </FormField>
          </>
        )}
      </form>
    </Dialog>
  );
}
