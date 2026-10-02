"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CaseDetail } from "@/types/case";
import { submitCase } from "@/services/api/cases";
import { queryKeys } from "@/constants/queryKeys";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Alert } from "@/components/ui/Alert";
import { Send, CheckCircle2, XCircle, AlertTriangle, Lock, ShieldCheck } from "lucide-react";

export interface SubmitCaseSectionProps {
  caseData: CaseDetail;
  isMaker: boolean;
  onSuccessSubmit?: () => void;
}

export function SubmitCaseSection({
  caseData,
  isMaker,
  onSuccessSubmit,
}: SubmitCaseSectionProps) {
  const queryClient = useQueryClient();
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const activeParticipants = caseData.participants.filter(
    (p) => p.status === "ACTIVE"
  );

  const hasMaker = !!caseData.maker?.id;
  const checkers = activeParticipants.filter((p) => p.role === "CHECKER");
  const hasChecker = checkers.length >= 1;
  const signers = activeParticipants.filter((p) => p.role === "SIGNER");
  const hasSigner = signers.length === 1;
  const executers = activeParticipants.filter((p) => p.role === "EXECUTER");
  const hasExecuter = executers.length === 1;

  // Verify SoD uniqueness
  const assignedIds = new Set<string>();
  if (caseData.maker?.id) assignedIds.add(caseData.maker.id);
  let sodValid = true;
  for (const p of activeParticipants) {
    if (assignedIds.has(p.user_id) && p.role !== "MAKER") {
      sodValid = false;
      break;
    }
    assignedIds.add(p.user_id);
  }

  const isEligible =
    caseData.status === "DRAFT" &&
    isMaker &&
    hasMaker &&
    hasChecker &&
    hasSigner &&
    hasExecuter &&
    sodValid;

  const submitMutation = useMutation({
    mutationFn: () => submitCase(caseData.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.case(caseData.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cases() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
      setIsConfirmOpen(false);
      setSubmitError(null);
      if (onSuccessSubmit) {
        onSuccessSubmit();
      }
    },
    onError: (err: unknown) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.case(caseData.id) });
      const msg =
        err instanceof Error
          ? err.message
          : "Gagal mengajukan case. Periksa kembali aturan Segregation of Duties dan kelengkapan peran.";
      setSubmitError(msg);
    },
  });

  const handleConfirmSubmit = () => {
    setSubmitError(null);
    submitMutation.mutate();
  };

  if (caseData.status !== "DRAFT") {
    return null;
  }

  if (!isMaker) {
    return (
      <Card className="border-slate-200 bg-slate-50/50">
        <CardContent className="p-4 text-xs text-slate-500 flex items-center gap-2">
          <Lock className="h-4 w-4 text-slate-400" />
          <span>
            Hanya Maker (inisiator) yang berwenang mengajukan case ini ke proses persetujuan.
          </span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50/20 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-blue-600" aria-hidden="true" />
          <CardTitle className="text-base font-semibold text-slate-900">
            Kesiapan Pengajuan Kasus (Submit Case)
          </CardTitle>
        </div>
        <CardDescription>
          Validasi prasyarat tata kelola Sentinel sebelum case dibekukan dan diproses oleh AI.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        {/* Checklist */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 bg-white p-2.5 rounded border border-slate-200">
            {hasMaker ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500 shrink-0" />
            )}
            <span className={hasMaker ? "text-slate-800" : "text-red-700"}>
              Maker: {caseData.maker?.name || "Belum ada"} (Tepat 1)
            </span>
          </div>

          <div className="flex items-center gap-2 bg-white p-2.5 rounded border border-slate-200">
            {hasChecker ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500 shrink-0" />
            )}
            <span className={hasChecker ? "text-slate-800" : "text-red-700"}>
              Checker: {checkers.length} pengguna (Minimal 1)
            </span>
          </div>

          <div className="flex items-center gap-2 bg-white p-2.5 rounded border border-slate-200">
            {hasSigner ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500 shrink-0" />
            )}
            <span className={hasSigner ? "text-slate-800" : "text-red-700"}>
              Signer: {signers[0]?.name || "Belum ditugaskan"} (Tepat 1)
            </span>
          </div>

          <div className="flex items-center gap-2 bg-white p-2.5 rounded border border-slate-200">
            {hasExecuter ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500 shrink-0" />
            )}
            <span className={hasExecuter ? "text-slate-800" : "text-red-700"}>
              Executer: {executers[0]?.name || "Belum ditugaskan"} (Tepat 1)
            </span>
          </div>
        </div>

        {!sodValid && (
          <Alert variant="destructive" title="Pelanggaran Segregation of Duties">
            Satu pengguna tidak boleh merangkap lebih dari satu peran aktif dalam case ini.
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-blue-100">
          <p className="text-xs text-slate-500">
            {isEligible
              ? "Semua prasyarat terpenuhi. Anda dapat mengajukan kasus ini."
              : "Lengkapi seluruh peran partisipan di atas untuk mengaktifkan tombol pengajuan."}
          </p>

          <Button
            type="button"
            variant="primary"
            disabled={!isEligible}
            onClick={() => {
              setSubmitError(null);
              setIsConfirmOpen(true);
            }}
            className="shrink-0"
          >
            <Send className="h-4 w-4 mr-1.5" />
            Ajukan Kasus (Submit Case)
          </Button>
        </div>
      </CardContent>

      {/* Confirmation Dialog with Freeze Warning */}
      <Dialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title="Konfirmasi Pengajuan Kasus (Submit)"
        description="Harap tinjau kembali data sebelum konfirmasi akhir."
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setIsConfirmOpen(false)}
              disabled={submitMutation.isPending}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmSubmit}
              isLoading={submitMutation.isPending}
            >
              Ya, Ajukan & Bekukan Kasus
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-sm">
          {submitError && (
            <Alert variant="destructive" title="Pengajuan Ditolak Backend">
              {submitError}
            </Alert>
          )}

          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <span>PERINGATAN PEMBEKUAN DATA (SUBMISSION FREEZE)</span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              Setelah tombol konfirmasi ditekan:
            </p>
            <ul className="text-xs list-disc list-inside space-y-1 text-amber-800 pl-1">
              <li>Rincian deskripsi kasus dan urgensi akan <strong>dibekukan permanen</strong>.</li>
              <li>Penugasan partisipan (Maker, Checker, Signer, Executer) <strong>tidak dapat diubah</strong>.</li>
              <li>Status kasus langsung beralih ke <strong>AI_ANALYSIS</strong> untuk verifikasi kebijakan Sentinel.</li>
            </ul>
          </div>

          <p className="text-xs text-slate-600">
            Apakah Anda yakin ingin melanjutkan pengajuan untuk kasus <strong>{caseData.case_number}</strong>?
          </p>
        </div>
      </Dialog>
    </Card>
  );
}
