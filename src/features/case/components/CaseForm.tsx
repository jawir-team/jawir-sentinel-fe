"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CaseDetail, Urgency } from "@/types/case";
import { getCaseTypes } from "@/services/api/caseTypes";
import { queryKeys } from "@/constants/queryKeys";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { FormField } from "@/components/ui/FormField";
import { Alert } from "@/components/ui/Alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { CaseStatusBadge } from "./StatusBadges";
import { Lock, Save, ArrowLeft } from "lucide-react";

export interface CaseFormProps {
  initialData?: CaseDetail;
  onSubmit: (values: {
    case_type_id: string;
    title: string;
    description: string;
    urgency: Urgency;
  }) => Promise<void>;
  isLoading?: boolean;
  serverError?: string | null;
}

export function CaseForm({
  initialData,
  onSubmit,
  isLoading = false,
  serverError,
}: CaseFormProps) {
  const router = useRouter();

  const isEdit = !!initialData;
  const isDraft = !isEdit || initialData?.status === "DRAFT";
  const isReadOnly = isEdit && !isDraft;

  const [caseTypeId, setCaseTypeId] = React.useState(
    initialData?.case_type?.id || ""
  );
  const [title, setTitle] = React.useState(initialData?.title || "");
  const [description, setDescription] = React.useState(
    initialData?.description || ""
  );
  const [urgency, setUrgency] = React.useState<Urgency>(
    initialData?.urgency || "HIGH"
  );
  const [clientError, setClientError] = React.useState<string | null>(null);

  const { data: caseTypes, isLoading: loadingCaseTypes } = useQuery({
    queryKey: queryKeys.caseTypes(),
    queryFn: getCaseTypes,
  });

  // Set default case type if available and empty
  React.useEffect(() => {
    if (!caseTypeId && caseTypes && caseTypes.length > 0) {
      setCaseTypeId(caseTypes[0].id);
    }
  }, [caseTypes, caseTypeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    if (!title.trim()) {
      setClientError("Judul case wajib diisi.");
      return;
    }
    if (!description.trim()) {
      setClientError("Deskripsi permasalahan case wajib diisi.");
      return;
    }
    if (!caseTypeId) {
      setClientError("Pilih tipe case yang sesuai.");
      return;
    }

    setClientError(null);
    await onSubmit({
      case_type_id: caseTypeId,
      title: title.trim(),
      description: description.trim(),
      urgency,
    });
  };

  return (
    <Card className="max-w-3xl shadow-sm border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-xl">
            {isEdit ? `Ubah Case ${initialData.case_number}` : "Formulir Pembuatan Case"}
          </CardTitle>
          <CardDescription>
            {isEdit
              ? "Perbarui rincian kasus sebelum diajukan ke tahap analisis AI."
              : "Isi data anomali atau pengecualian operasional yang memerlukan persetujuan berjenjang."}
          </CardDescription>
        </div>
        {isEdit && (
          <div className="flex items-center gap-2">
            <CaseStatusBadge status={initialData.status} />
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6 pt-4">
        {isReadOnly && (
          <Alert variant="warning" title="Mode Baca Saja (Submission Freeze)">
            <div className="flex items-center gap-1.5 mt-1">
              <Lock className="h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
              <span>
                Case ini berada dalam status <strong>{initialData?.status}</strong>. Rincian
                inti tidak dapat diubah setelah diajukan (freeze).
              </span>
            </div>
          </Alert>
        )}

        {(serverError || clientError) && (
          <Alert variant="destructive" title="Kesalahan Formulir">
            {serverError || clientError}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <FormField
            label="Tipe Kasus (Case Type)"
            id="case-type"
            required
            hint="Tipe kasus menentukan kebijakan (SOP) dan SLA yang akan diaplikasikan."
          >
            <Select
              id="case-type"
              value={caseTypeId}
              onChange={(e) => setCaseTypeId(e.target.value)}
              disabled={isReadOnly || isEdit || isLoading || loadingCaseTypes}
            >
              {loadingCaseTypes ? (
                <option value="">Memuat tipe kasus...</option>
              ) : (
                caseTypes?.map((ct) => (
                  <option key={ct.id} value={ct.id}>
                    {ct.name} ({ct.code})
                  </option>
                ))
              )}
            </Select>
          </FormField>

          <FormField
            label="Judul Kasus"
            id="case-title"
            required
            hint="Ringkasan singkat mengenai isu/eksepsi yang terjadi."
          >
            <Input
              id="case-title"
              placeholder="Contoh: Settlement reconciliation mismatch"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isReadOnly || isLoading}
              maxLength={150}
            />
          </FormField>

          <FormField
            label="Deskripsi Lengkap Masalah & Fakta"
            id="case-desc"
            required
            hint="Sertakan detail kuantitatif (jumlah transaksi, selisih nilai, batas waktu cutoff)."
          >
            <Textarea
              id="case-desc"
              rows={5}
              placeholder="Jelaskan anomali, transaksi yang terdampak, serta alasan perlunya penanganan darurat/eksepsi..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isReadOnly || isLoading}
            />
          </FormField>

          <FormField
            label="Tingkat Urgensi"
            id="case-urgency"
            required
            hint="Menentukan prioritas peninjauan oleh Checker dan Signer."
          >
            <Select
              id="case-urgency"
              value={urgency}
              onChange={(e) => setUrgency(e.target.value as Urgency)}
              disabled={isReadOnly || isLoading}
            >
              <option value="LOW">LOW - Standar / Tidak Mendesak</option>
              <option value="MEDIUM">MEDIUM - Butuh Perhatian Segera</option>
              <option value="HIGH">HIGH - Menjelang Cutoff Operasional</option>
              <option value="CRITICAL">CRITICAL - Dampak Finansial Langsung / Urgent</option>
            </Select>
          </FormField>

          {isEdit && (
            <div className="rounded-lg bg-slate-50 p-4 border border-slate-200 text-xs space-y-1.5 text-slate-600">
              <p>
                <strong>Pemilik / Maker:</strong> {initialData.maker?.name || "Current User"} (Permanen)
              </p>
              <p>
                <strong>Dibuat Pada:</strong>{" "}
                {new Date(initialData.created_at).toLocaleString("id-ID")}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Kembali
            </Button>

            {!isReadOnly && (
              <Button type="submit" variant="primary" isLoading={isLoading}>
                <Save className="h-4 w-4 mr-1.5" aria-hidden="true" />
                {isEdit ? "Simpan Perubahan" : "Buat Draft Case"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
