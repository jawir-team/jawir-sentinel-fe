"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CaseDetail, CaseRole, CaseParticipant } from "@/types/case";
import { getUsers } from "@/services/api/users";
import { assignParticipant, removeParticipant } from "@/services/api/cases";
import { queryKeys } from "@/constants/queryKeys";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Plus, Trash2, Users, ShieldAlert, CheckCircle2, Lock } from "lucide-react";

export interface ParticipantAssignmentSectionProps {
  caseData: CaseDetail;
}

export function ParticipantAssignmentSection({
  caseData,
}: ParticipantAssignmentSectionProps) {
  const queryClient = useQueryClient();
  const isDraft = caseData.status === "DRAFT";

  const [selectedCheckerId, setSelectedCheckerId] = React.useState("");
  const [selectedSignerId, setSelectedSignerId] = React.useState("");
  const [selectedExecuterId, setSelectedExecuterId] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Fetch ACTIVE users
  const { data: users } = useQuery({
    queryKey: queryKeys.users({ status: "ACTIVE" }),
    queryFn: () => getUsers({ status: "ACTIVE" }),
  });

  // Calculate active participant user IDs to enforce strict SoD
  const activeParticipants = caseData.participants.filter(
    (p) => p.status === "ACTIVE"
  );

  const assignedUserIds = new Set<string>();
  if (caseData.maker?.id) assignedUserIds.add(caseData.maker.id);
  activeParticipants.forEach((p) => assignedUserIds.add(p.user_id));

  // Available users for new assignments (must be ACTIVE and not yet assigned to any role in this case)
  const availableUsers = (users || []).filter(
    (u) => u.status === "ACTIVE" && !assignedUserIds.has(u.id)
  );

  const currentCheckers = activeParticipants.filter((p) => p.role === "CHECKER");
  const currentSigner = activeParticipants.find((p) => p.role === "SIGNER");
  const currentExecuter = activeParticipants.find((p) => p.role === "EXECUTER");

  const assignMutation = useMutation({
    mutationFn: (payload: { user_id: string; role: CaseRole }) =>
      assignParticipant(caseData.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.case(caseData.id) });
      setSelectedCheckerId("");
      setSelectedSignerId("");
      setSelectedExecuterId("");
      setErrorMessage(null);
    },
    onError: (err: unknown) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.case(caseData.id) });
      const msg =
        err instanceof Error
          ? err.message
          : "Gagal menugaskan partisipan karena pelanggaran Segregation of Duties.";
      setErrorMessage(msg);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (participantId: string) =>
      removeParticipant(caseData.id, participantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.case(caseData.id) });
      setErrorMessage(null);
    },
    onError: (err: unknown) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.case(caseData.id) });
      const msg =
        err instanceof Error ? err.message : "Gagal menghapus penugasan partisipan.";
      setErrorMessage(msg);
    },
  });

  const handleAddChecker = () => {
    if (!selectedCheckerId) return;
    setErrorMessage(null);
    assignMutation.mutate({ user_id: selectedCheckerId, role: "CHECKER" });
  };

  const handleAssignSigner = () => {
    if (!selectedSignerId) return;
    setErrorMessage(null);
    assignMutation.mutate({ user_id: selectedSignerId, role: "SIGNER" });
  };

  const handleAssignExecuter = () => {
    if (!selectedExecuterId) return;
    setErrorMessage(null);
    assignMutation.mutate({ user_id: selectedExecuterId, role: "EXECUTER" });
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" aria-hidden="true" />
            <CardTitle className="text-base font-semibold">
              Penugasan Partisipan Alur Kerja (Workflow Roles)
            </CardTitle>
          </div>
          {!isDraft && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              Terkunci (Read-Only)
            </div>
          )}
        </div>
        <CardDescription>
          Segregation of Duties: Setiap peran diisi oleh pengguna berbeda. Minimal 1
          Checker, tepat 1 Signer, dan tepat 1 Executer.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 pt-3">
        {errorMessage && (
          <Alert variant="destructive" title="Pelanggaran Aturan Penugasan">
            <div className="flex items-center gap-2 mt-1">
              <ShieldAlert className="h-4 w-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          </Alert>
        )}

        {/* 1. MAKER (Fixed) */}
        <div className="rounded-lg border border-slate-200 p-4 bg-slate-50/50 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="default">MAKER</Badge>
              <span className="text-sm font-semibold text-slate-900">
                Inisiator Kasus (Tepat 1)
              </span>
            </div>
            <span className="text-xs text-slate-400 font-mono">Immutable</span>
          </div>
          <div className="flex items-center justify-between text-sm text-slate-700 bg-white p-2.5 rounded border border-slate-200">
            <span className="font-medium">{caseData.maker?.name}</span>
            <span className="text-xs text-slate-500">(Pembuat & Pemilik Kasus)</span>
          </div>
        </div>

        {/* 2. CHECKERS (1..N) */}
        <div className="rounded-lg border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="warning">CHECKER</Badge>
              <span className="text-sm font-semibold text-slate-900">
                Verifikator Teknis / Risiko (1 atau Lebih)
              </span>
            </div>
            <span className="text-xs text-slate-500">
              {currentCheckers.length} Ditugaskan
            </span>
          </div>

          {currentCheckers.length === 0 ? (
            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
              ⚠️ Minimal 1 Checker wajib ditugaskan sebelum case dapat diajukan.
            </p>
          ) : (
            <div className="space-y-2">
              {currentCheckers.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between text-sm bg-slate-50 p-2.5 rounded border border-slate-200"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="font-medium text-slate-800">{c.name}</span>
                  </div>
                  {isDraft && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMutation.mutate(c.id)}
                      disabled={removeMutation.isPending}
                      className="text-slate-400 hover:text-red-600 h-7 w-7 p-0"
                      aria-label={`Hapus checker ${c.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {isDraft && (
            <div className="flex items-center gap-2 pt-2">
              <Select
                value={selectedCheckerId}
                onChange={(e) => setSelectedCheckerId(e.target.value)}
                disabled={assignMutation.isPending || availableUsers.length === 0}
                className="flex-1"
                aria-label="Pilih Checker tambahan"
              >
                <option value="">-- Pilih Pengguna untuk Checker --</option>
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.unit?.code} - {u.email})
                  </option>
                ))}
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddChecker}
                disabled={!selectedCheckerId || assignMutation.isPending}
              >
                <Plus className="h-4 w-4 mr-1" />
                Tambah Checker
              </Button>
            </div>
          )}
        </div>

        {/* 3. SIGNER (Tepat 1) */}
        <div className="rounded-lg border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="success">SIGNER</Badge>
              <span className="text-sm font-semibold text-slate-900">
                Otorisator / Penandatangan (Tepat 1)
              </span>
            </div>
            <span className="text-xs text-slate-500">
              {currentSigner ? "1 Ditugaskan" : "Belum Ada"}
            </span>
          </div>

          {currentSigner ? (
            <div className="flex items-center justify-between text-sm bg-slate-50 p-2.5 rounded border border-slate-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="font-medium text-slate-800">{currentSigner.name}</span>
              </div>
              {isDraft && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMutation.mutate(currentSigner.id)}
                  disabled={removeMutation.isPending}
                  className="text-slate-400 hover:text-red-600 h-7 w-7 p-0"
                  aria-label="Ganti signer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ) : (
            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
              ⚠️ Tepat 1 Signer wajib ditugaskan sebelum case dapat diajukan.
            </p>
          )}

          {isDraft && !currentSigner && (
            <div className="flex items-center gap-2 pt-2">
              <Select
                value={selectedSignerId}
                onChange={(e) => setSelectedSignerId(e.target.value)}
                disabled={assignMutation.isPending || availableUsers.length === 0}
                className="flex-1"
                aria-label="Pilih Signer"
              >
                <option value="">-- Pilih Pengguna untuk Signer --</option>
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.unit?.code} - {u.email})
                  </option>
                ))}
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAssignSigner}
                disabled={!selectedSignerId || assignMutation.isPending}
              >
                <Plus className="h-4 w-4 mr-1" />
                Tugaskan Signer
              </Button>
            </div>
          )}
        </div>

        {/* 4. EXECUTER (Tepat 1) */}
        <div className="rounded-lg border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">EXECUTER</Badge>
              <span className="text-sm font-semibold text-slate-900">
                Pelaksana Eksekusi (Tepat 1)
              </span>
            </div>
            <span className="text-xs text-slate-500">
              {currentExecuter ? "1 Ditugaskan" : "Belum Ada"}
            </span>
          </div>

          {currentExecuter ? (
            <div className="flex items-center justify-between text-sm bg-slate-50 p-2.5 rounded border border-slate-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="font-medium text-slate-800">{currentExecuter.name}</span>
              </div>
              {isDraft && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMutation.mutate(currentExecuter.id)}
                  disabled={removeMutation.isPending}
                  className="text-slate-400 hover:text-red-600 h-7 w-7 p-0"
                  aria-label="Ganti executer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ) : (
            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
              ⚠️ Tepat 1 Executer wajib ditugaskan sebelum case dapat diajukan.
            </p>
          )}

          {isDraft && !currentExecuter && (
            <div className="flex items-center gap-2 pt-2">
              <Select
                value={selectedExecuterId}
                onChange={(e) => setSelectedExecuterId(e.target.value)}
                disabled={assignMutation.isPending || availableUsers.length === 0}
                className="flex-1"
                aria-label="Pilih Executer"
              >
                <option value="">-- Pilih Pengguna untuk Executer --</option>
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.unit?.code} - {u.email})
                  </option>
                ))}
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAssignExecuter}
                disabled={!selectedExecuterId || assignMutation.isPending}
              >
                <Plus className="h-4 w-4 mr-1" />
                Tugaskan Executer
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
