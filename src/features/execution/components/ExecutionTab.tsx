"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CaseDetail } from "@/types/case";
import { useAuth } from "@/features/auth/context/AuthContext";
import { getExecutions, startExecution } from "@/services/api/executions";
import { queryKeys } from "@/constants/queryKeys";
import { ExecutionResultModal } from "./ExecutionResultModal";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingState } from "@/components/feedback/LoadingState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Alert } from "@/components/ui/Alert";
import {
  PlayCircle,
  CheckCircle2,
  AlertOctagon,
  XCircle,
  Clock,
  Info,
  ShieldCheck,
  History,
  Lock,
} from "lucide-react";

interface ExecutionTabProps {
  caseData: CaseDetail;
}

export function ExecutionTab({ caseData }: ExecutionTabProps) {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  const [resultModal, setResultModal] = React.useState<{
    isOpen: boolean;
    executionId: string;
    targetStatus: "SUCCESS" | "BLOCKED" | "FAILED";
  }>({
    isOpen: false,
    executionId: "",
    targetStatus: "SUCCESS",
  });

  const [startError, setStartError] = React.useState<string | null>(null);

  const isExecutionPhase = caseData.status === "EXECUTION";
  const isDone = caseData.status === "DONE";
  const currentAnalysisId = caseData.current_analysis?.id;

  // Fetch execution records for this case
  const {
    data: executions = [],
    isLoading: isLoadingExecutions,
    refetch: refetchExecutions,
  } = useQuery({
    queryKey: ["executions", caseData.id],
    queryFn: () => getExecutions(caseData.id),
    enabled: Boolean(currentAnalysisId),
  });

  // Check if current user is an assigned active Executer
  const executerParticipant = caseData.participants.find(
    (p) => p.role === "EXECUTER" && p.status === "ACTIVE"
  );
  const isAssignedExecuter = Boolean(
    executerParticipant &&
      (executerParticipant.user_id === currentUser?.id ||
        executerParticipant.name === currentUser?.name)
  );

  // Active in-progress execution
  const inProgressExecution = executions.find((e) => e.status === "IN_PROGRESS");
  // Execution on current analysis
  const currentAnalysisExecution = executions.find(
    (e) => e.analysis_id === currentAnalysisId
  );

  // Start execution mutation
  const startMutation = useMutation({
    mutationFn: () => {
      if (!currentAnalysisId) throw new Error("No active analysis to execute");
      return startExecution(caseData.id, { analysis_id: currentAnalysisId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.case(caseData.id) });
      queryClient.invalidateQueries({ queryKey: ["executions", caseData.id] });
      queryClient.invalidateQueries({ queryKey: queryKeys.history(caseData.id) });
      setStartError(null);
    },
    onError: (err: any) => {
      // Duplicate start or invalid state: refetch authoritative state
      queryClient.invalidateQueries({ queryKey: queryKeys.case(caseData.id) });
      queryClient.invalidateQueries({ queryKey: ["executions", caseData.id] });
      const msg =
        err?.message ||
        "Gagal memulai eksekusi. Kasus mungkin sudah memiliki eksekusi aktif atau status telah berubah.";
      setStartError(msg);
    },
  });

  if (!currentAnalysisId && !isDone) {
    return (
      <EmptyState
        icon={<PlayCircle className="h-8 w-8 text-slate-400" />}
        title="Tahap Eksekusi Belum Dibuka"
        description="Eksekusi operasional hanya dapat dimulai setelah analisis disetujui penuh oleh Signer (Status: EXECUTION)."
      />
    );
  }

  if (isLoadingExecutions) {
    return <LoadingState label="Memuat riwayat eksekusi..." />;
  }

  return (
    <div className="space-y-6" data-testid="execution-tab">
      {/* SUCCESS & DONE celebration banner */}
      {isDone && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 text-emerald-950 shadow-xs">
          <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h4 className="font-bold text-sm">Kasus Telah Tuntas Selesai (DONE)</h4>
            <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
              Seluruh tindakan operasional telah diverifikasi dan diselesaikan dengan sukses. Kasus sekarang bersifat permanen (read-only) untuk tujuan audit kepatuhan.
            </p>
          </div>
        </div>
      )}

      {/* Execution Controls during EXECUTION phase */}
      {isExecutionPhase && (
        <Card className="border-emerald-300 bg-emerald-50/20 shadow-sm" data-testid="execution-control-card">
          <CardHeader className="pb-3 border-b border-emerald-100">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-emerald-950">
                <PlayCircle className="h-4 w-4 text-emerald-700" />
                <span>Panel Tindakan Eksekusi Operasional</span>
              </CardTitle>
              <Badge variant="outline" className="font-mono text-xs border-emerald-300 text-emerald-900 bg-emerald-50">
                EXECUTER: {executerParticipant?.name || "Belum Ditugaskan"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            {startError && (
              <Alert variant="destructive" title="Kendala Memulai Eksekusi">
                {startError}
              </Alert>
            )}

            {isAssignedExecuter ? (
              inProgressExecution ? (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-900">
                      <Clock className="h-4 w-4 animate-spin text-blue-600" />
                      <span>
                        Eksekusi sedang berjalan (ID:{" "}
                        <strong className="font-mono">{inProgressExecution.id}</strong>) sejak{" "}
                        {inProgressExecution.started_at
                          ? new Date(inProgressExecution.started_at).toLocaleTimeString("id-ID")
                          : "baru saja"}
                      </span>
                    </div>
                    <Badge variant="warning" className="font-mono text-[10px] animate-pulse">
                      IN_PROGRESS
                    </Badge>
                  </div>

                  <p className="text-slate-600 leading-relaxed">
                    Setelah langkah mitigasi operasional dijalankan di sistem target (mis. core banking/ledger), laporkan hasil akhir di bawah:
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        setResultModal({
                          isOpen: true,
                          executionId: inProgressExecution.id,
                          targetStatus: "SUCCESS",
                        })
                      }
                      className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Laporkan Selesai (SUCCESS)</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setResultModal({
                          isOpen: true,
                          executionId: inProgressExecution.id,
                          targetStatus: "BLOCKED",
                        })
                      }
                      className="gap-1.5 text-amber-800 border-amber-300 hover:bg-amber-50"
                    >
                      <AlertOctagon className="h-4 w-4 text-amber-600" />
                      <span>Laporkan Terhambat (BLOCKED)</span>
                    </Button>

                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        setResultModal({
                          isOpen: true,
                          executionId: inProgressExecution.id,
                          targetStatus: "FAILED",
                        })
                      }
                      className="gap-1.5"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Laporkan Gagal (FAILED)</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-slate-700 leading-relaxed">
                    Kasus telah diotorisasi penuh oleh Signer. Sebagai Executer berwenang, klik tombol di bawah untuk memulai sesi pelaksanaan tindakan operasional.
                  </p>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => startMutation.mutate()}
                    isLoading={startMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                  >
                    <PlayCircle className="h-4 w-4" />
                    <span>Mulai Eksekusi (Start Execution)</span>
                  </Button>
                </div>
              )
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-3 text-slate-700">
                <Info className="h-4 w-4 text-emerald-600 shrink-0" />
                <p>
                  Kasus siap dieksekusi. Hanya <strong>Executer</strong> yang berwenang (
                  <strong className="text-slate-900">{executerParticipant?.name}</strong>) yang dapat memulai dan melaporkan hasil eksekusi.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Historical Execution Attempts List */}
      <Card className="border-slate-200 shadow-sm" data-testid="execution-history-card">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900">
            <History className="h-4 w-4 text-slate-600" />
            <span>Riwayat Percobaan Eksekusi ({executions.length} catatan)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 text-xs">
          {executions.length === 0 ? (
            <p className="text-slate-500 italic py-4 text-center">
              Belum ada sesi eksekusi yang dimulai untuk kasus ini.
            </p>
          ) : (
            <div className="space-y-3">
              {executions.map((exec, idx) => {
                const isSuccess = exec.status === "SUCCESS";
                const isBlocked = exec.status === "BLOCKED";
                const isFailed = exec.status === "FAILED";
                const isInProgress = exec.status === "IN_PROGRESS";

                return (
                  <div
                    key={exec.id || idx}
                    className="p-3 rounded-lg border border-slate-200 bg-white space-y-2 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">
                          {exec.id}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          (Analysis: {exec.analysis_id})
                        </span>
                      </div>
                      <div>
                        {isSuccess && (
                          <Badge variant="success" className="gap-1 font-semibold text-[10px]">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>SUCCESS</span>
                          </Badge>
                        )}
                        {isBlocked && (
                          <Badge variant="warning" className="gap-1 font-semibold text-[10px]">
                            <AlertOctagon className="h-3 w-3" />
                            <span>BLOCKED</span>
                          </Badge>
                        )}
                        {isFailed && (
                          <Badge variant="destructive" className="gap-1 font-semibold text-[10px]">
                            <XCircle className="h-3 w-3" />
                            <span>FAILED</span>
                          </Badge>
                        )}
                        {isInProgress && (
                          <Badge variant="secondary" className="gap-1 font-semibold text-[10px] animate-pulse">
                            <Clock className="h-3 w-3 text-blue-600" />
                            <span>IN PROGRESS</span>
                          </Badge>
                        )}
                      </div>
                    </div>

                    {exec.action_taken && (
                      <div>
                        <span className="font-semibold text-slate-700 block text-[11px]">
                          Tindakan:
                        </span>
                        <p className="text-slate-800 mt-0.5 leading-snug">{exec.action_taken}</p>
                      </div>
                    )}

                    {exec.result && (
                      <div className="p-2 rounded bg-emerald-50/70 border border-emerald-100 text-emerald-950">
                        <span className="font-semibold text-[11px] block">Hasil:</span>
                        <p className="mt-0.5 leading-snug">{exec.result}</p>
                      </div>
                    )}

                    {exec.blocker && (
                      <div className="p-2 rounded bg-rose-50/70 border border-rose-100 text-rose-950">
                        <span className="font-semibold text-[11px] block">Kendala / Blocker:</span>
                        <p className="mt-0.5 leading-snug">{exec.blocker}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
                      <span>Eksekutor: {exec.executed_by?.name || "Sistem Operasional"}</span>
                      {exec.completed_at ? (
                        <span>Selesai: {new Date(exec.completed_at).toLocaleString("id-ID")}</span>
                      ) : exec.started_at ? (
                        <span>Dimulai: {new Date(exec.started_at).toLocaleString("id-ID")}</span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Execution Result Submission Modal */}
      {resultModal.isOpen && (
        <ExecutionResultModal
          isOpen={resultModal.isOpen}
          onClose={() => setResultModal((prev) => ({ ...prev, isOpen: false }))}
          caseId={caseData.id}
          executionId={resultModal.executionId}
          targetStatus={resultModal.targetStatus}
          onSuccessResult={() => {
            refetchExecutions();
          }}
        />
      )}
    </div>
  );
}
