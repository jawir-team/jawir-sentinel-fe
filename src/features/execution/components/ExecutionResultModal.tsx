"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { FormField } from "@/components/ui/FormField";
import { Alert } from "@/components/ui/Alert";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitExecutionResult } from "@/services/api/executions";
import { queryKeys } from "@/constants/queryKeys";
import { CheckCircle2, AlertOctagon, XCircle, AlertTriangle } from "lucide-react";

interface ExecutionResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  executionId: string;
  targetStatus: "SUCCESS" | "BLOCKED" | "FAILED";
  onSuccessResult?: (nextStatus: string) => void;
  onStaleConflict?: () => void;
}

export function ExecutionResultModal({
  isOpen,
  onClose,
  caseId,
  executionId,
  targetStatus,
  onSuccessResult,
  onStaleConflict,
}: ExecutionResultModalProps) {
  const queryClient = useQueryClient();
  const [actionTaken, setActionTaken] = React.useState("");
  const [resultText, setResultText] = React.useState("");
  const [blockerText, setBlockerText] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setActionTaken("");
      setResultText("");
      setBlockerText("");
      setErrorMessage(null);
    }
  }, [isOpen, targetStatus]);

  const resultMutation = useMutation({
    mutationFn: () =>
      submitExecutionResult(caseId, executionId, {
        status: targetStatus,
        action_taken: actionTaken.trim(),
        result: resultText.trim() || undefined,
        blocker: blockerText.trim() || undefined,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.case(caseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cases() });
      queryClient.invalidateQueries({ queryKey: queryKeys.history(caseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: ["executions", caseId] });

      onSuccessResult?.(data.case_status);
      onClose();
    },
    onError: (err: any) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.case(caseId) });
      queryClient.invalidateQueries({ queryKey: ["executions", caseId] });
      if (err?.status === 409 || err?.code === "STALE_ANALYSIS") {
        onStaleConflict?.();
        onClose();
        return;
      }
      const msg =
        err?.message ||
        "Gagal menyimpan hasil eksekusi. Silakan periksa status kasus terkini.";
      setErrorMessage(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionTaken.trim()) {
      setErrorMessage("Tindakan yang telah dilakukan (action_taken) wajib diisi.");
      return;
    }

    if (targetStatus === "SUCCESS" && !resultText.trim()) {
      setErrorMessage("Hasil konfirmasi penyelesaian (result) wajib diisi untuk status SUCCESS.");
      return;
    }

    if ((targetStatus === "BLOCKED" || targetStatus === "FAILED") && !blockerText.trim()) {
      setErrorMessage(
        "Kendala/faktor penghambat (blocker) wajib diisi untuk mendokumentasikan alasan kegagalan/hambatan."
      );
      return;
    }

    setErrorMessage(null);
    resultMutation.mutate();
  };

  const getTitleAndDesc = () => {
    switch (targetStatus) {
      case "SUCCESS":
        return {
          title: "Laporkan Eksekusi Berhasil Selesai (SUCCESS)",
          desc: "Konfirmasi bahwa seluruh rekomendasi tindakan operasional telah tuntas dieksekusi. Kasus akan beralih ke status DONE.",
          btnLabel: "Konfirmasi Eksekusi Berhasil (DONE)",
          variant: "primary" as const,
        };
      case "BLOCKED":
        return {
          title: "Laporkan Eksekusi Terhambat (BLOCKED)",
          desc: "Tindakan eksekusi tertahan oleh faktor eksternal atau dependensi sistem. Kasus akan dialihkan ke re-analisis AI atau eskalasi.",
          btnLabel: "Konfirmasi Eksekusi Terhambat",
          variant: "outline" as const,
        };
      case "FAILED":
        return {
          title: "Laporkan Eksekusi Gagal (FAILED)",
          desc: "Tindakan eksekusi mengalami kegagalan operasional. Kasus akan dialihkan ke re-analisis AI atau eskalasi jika batas kuota tercapai.",
          btnLabel: "Konfirmasi Eksekusi Gagal",
          variant: "destructive" as const,
        };
    }
  };

  const config = getTitleAndDesc();

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={config.title}
      description={config.desc}
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={resultMutation.isPending}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant={config.variant}
            size="sm"
            onClick={handleSubmit}
            isLoading={resultMutation.isPending}
          >
            {config.btnLabel}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {errorMessage && (
          <Alert variant="destructive" title="Validasi Hasil Eksekusi">
            {errorMessage}
          </Alert>
        )}

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
          <span className="text-[11px] text-slate-500 font-mono block">
            ID Eksekusi Aktif:
          </span>
          <span className="font-mono font-bold text-slate-900 text-xs">
            {executionId}
          </span>
        </div>

        <FormField
          label="Tindakan Operasional yang Dijalankan (Action Taken - Wajib)"
          required
        >
          <Textarea
            rows={3}
            placeholder="Contoh: Mengisolasi 37 transaksi mismatch dari pool kliring dan memicu retry rekonsiliasi manual..."
            value={actionTaken}
            onChange={(e) => setActionTaken(e.target.value)}
            required
          />
        </FormField>

        {targetStatus === "SUCCESS" && (
          <FormField label="Hasil Konfirmasi Penyelesaian (Result - Wajib)" required>
            <Textarea
              rows={2}
              placeholder="Contoh: Seluruh rekonsiliasi batch selesai seimbang dan ledger sinkron tanpa selisih."
              value={resultText}
              onChange={(e) => setResultText(e.target.value)}
              required
            />
          </FormField>
        )}

        {(targetStatus === "BLOCKED" || targetStatus === "FAILED") && (
          <FormField
            label="Deskripsi Kendala / Faktor Penghambat (Blocker - Wajib)"
            required
          >
            <Textarea
              rows={3}
              placeholder="Contoh: File kliring upstream dari bank koresponden tidak dapat diakses atau timeout..."
              value={blockerText}
              onChange={(e) => setBlockerText(e.target.value)}
              required
            />
          </FormField>
        )}
      </form>
    </Dialog>
  );
}
