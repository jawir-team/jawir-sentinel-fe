"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CaseDetail } from "@/types/case";
import { EvidenceItem } from "@/types/evidence";
import { getEvidences, createEvidence } from "@/services/api/evidences";
import { queryKeys } from "@/constants/queryKeys";
import { useAuth } from "@/features/auth/context/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { FormField } from "@/components/ui/FormField";
import { Dialog } from "@/components/ui/Dialog";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { LoadingState } from "@/components/feedback/LoadingState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import {
  FileText,
  Paperclip,
  Plus,
  Lock,
  Calendar,
  User,
  ShieldCheck,
  FileCode,
} from "lucide-react";

export interface EvidenceTabProps {
  caseData: CaseDetail;
}

export function EvidenceTab({ caseData }: EvidenceTabProps) {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [formError, setFormError] = React.useState<string | null>(null);

  const {
    data: evidences,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.evidences(caseData.id),
    queryFn: () => getEvidences(caseData.id),
  });

  const isMaker =
    caseData.maker?.id === currentUser?.id ||
    caseData.maker?.name === currentUser?.name;

  const isActiveParticipant =
    isMaker ||
    caseData.participants.some(
      (p) =>
        (p.user_id === currentUser?.id || p.name === currentUser?.name) &&
        p.status === "ACTIVE"
    );

  // Authorization check per spec
  const canAddEvidence = React.useMemo(() => {
    if (caseData.status === "DRAFT") {
      return isMaker;
    }
    const participantAllowedStates = [
      "CHECKING",
      "SIGNING",
      "EXECUTION",
      "ESCALATION_REQUIRED",
    ];
    if (participantAllowedStates.includes(caseData.status)) {
      return isActiveParticipant;
    }
    return false;
  }, [caseData.status, isMaker, isActiveParticipant]);

  const createMutation = useMutation({
    mutationFn: (payload: { title: string; content: string }) =>
      createEvidence(caseData.id, {
        evidence_type: "COMMENT",
        title: payload.title,
        content: payload.content,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.evidences(caseData.id) });
      setIsDialogOpen(false);
      setTitle("");
      setContent("");
      setFormError(null);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Gagal menambahkan bukti dokumen.";
      setFormError(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setFormError("Judul dan isi catatan bukti wajib diisi.");
      return;
    }
    createMutation.mutate({ title: title.trim(), content: content.trim() });
  };

  const getSourceBadgeVariant = (source: string) => {
    switch (source) {
      case "MAKER":
        return "default" as const;
      case "CHECKER":
        return "warning" as const;
      case "SIGNER":
        return "success" as const;
      case "EXECUTER":
        return "secondary" as const;
      case "SYSTEM":
        return "outline" as const;
      default:
        return "secondary" as const;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            Daftar Bukti Dokumen & Konteks Kasus
          </h2>
          <p className="text-xs text-slate-500">
            Bukti pendukung yang dipertimbangkan oleh AI Sentinel dan verifikator manusia.
          </p>
        </div>

        {canAddEvidence ? (
          <Button variant="primary" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
            Tambah Catatan Bukti
          </Button>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            Penambahan Bukti Dikunci ({caseData.status})
          </div>
        )}
      </div>

      {isLoading ? (
        <LoadingState label="Memuat bukti dokumen..." />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !evidences || evidences.length === 0 ? (
        <EmptyState
          icon={<Paperclip className="h-8 w-8 text-slate-400" />}
          title="Belum Ada Bukti Dokumen"
          description={
            canAddEvidence
              ? "Tambahkan bukti transaksi, audit trail, atau catatan pendukung untuk memvalidasi kasus ini."
              : "Belum ada dokumen bukti yang dilampirkan pada kasus ini."
          }
          action={
            canAddEvidence && (
              <Button variant="primary" onClick={() => setIsDialogOpen(true)}>
                Tambah Bukti Pertama
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {evidences.map((ev) => (
            <Card key={ev.id} className="border-slate-200 shadow-sm">
              <CardHeader className="py-3.5 border-b border-slate-100 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    {ev.evidence_type === "FILE" ? (
                      <Paperclip className="h-4 w-4" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold text-slate-900">
                      {ev.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 font-mono">
                      <span>Tipe: {ev.evidence_type}</span>
                      {ev.mime_type && <span>• {ev.mime_type}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={getSourceBadgeVariant(ev.source_type)} dot>
                    {ev.source_type}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="py-3.5 space-y-3 text-xs">
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {ev.content}
                </p>

                {ev.file_path && (
                  <div className="flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-200 text-slate-700 font-mono text-[11px]">
                    <FileCode className="h-4 w-4 text-slate-500" />
                    <span className="truncate">{ev.file_path}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-slate-400 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3 w-3" />
                    <span>Oleh: {ev.source_user?.name || "System"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(ev.created_at).toLocaleString("id-ID")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog Tambah Evidence */}
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Tambah Catatan Bukti Pendukung"
        description="Sertakan konteks faktual tambahan untuk dipertimbangkan oleh verifikator."
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={createMutation.isPending}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              isLoading={createMutation.isPending}
            >
              Simpan Bukti
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <Alert variant="destructive" title="Gagal Menyimpan">
              {formError}
            </Alert>
          )}

          <div className="rounded-lg bg-blue-50/50 p-3 border border-blue-100 text-xs text-blue-800 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <span>Otorisasi Penambahan Bukti</span>
            </div>
            <p className="text-[11px] text-blue-700">
              Peran pengunggah otomatis dipetakan dari penugasan aktif Anda dalam workflow
              kasus ini.
            </p>
          </div>

          <FormField label="Judul Bukti" id="ev-title" required>
            <Input
              id="ev-title"
              placeholder="Contoh: Log kegagalan clearing batch #402"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={createMutation.isPending}
            />
          </FormField>

          <FormField
            label="Isi Keterangan & Fakta Pendukung"
            id="ev-content"
            required
            hint="Sebutkan rincian nomor transaksi atau catatan komunikasi internal."
          >
            <Textarea
              id="ev-content"
              rows={5}
              placeholder="Tuliskan data faktual..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={createMutation.isPending}
            />
          </FormField>
        </form>
      </Dialog>
    </div>
  );
}
