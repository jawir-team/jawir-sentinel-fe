"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { ContentContainer } from "@/components/layout/ContentContainer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { FormField } from "@/components/ui/FormField";
import { Dialog } from "@/components/ui/Dialog";
import { Alert } from "@/components/ui/Alert";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { LoadingState } from "@/components/feedback/LoadingState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { getCaseTypes, createCaseType } from "@/services/api/caseTypes";
import { queryKeys } from "@/constants/queryKeys";
import { useAuth } from "@/features/auth/context/AuthContext";
import { Plus, FileSpreadsheet } from "lucide-react";

export default function CaseTypesPage() {
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [formError, setFormError] = React.useState<string | null>(null);

  const { data: caseTypes, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.caseTypes(),
    queryFn: getCaseTypes,
  });

  const createMutation = useMutation({
    mutationFn: createCaseType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.caseTypes() });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof Error ? err.message : "Gagal membuat case type.";
      setFormError(msg);
    },
  });

  const resetForm = () => {
    setCode("");
    setName("");
    setDescription("");
    setFormError(null);
  };

  const handleOpenDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      setFormError("Kode dan nama case type wajib diisi.");
      return;
    }
    createMutation.mutate({
      code: code.trim().toUpperCase(),
      name: name.trim(),
      description: description.trim() || undefined,
    });
  };

  return (
    <ContentContainer>
      <PageHeader
        title="Manajemen Case Types"
        description="Definisi jenis case dan template proses workflow tata kelola Sentinel."
        action={
          isAdmin && (
            <Button variant="primary" onClick={handleOpenDialog}>
              <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Tambah Case Type
            </Button>
          )
        }
      />

      {isLoading ? (
        <LoadingState label="Memuat case types..." />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !caseTypes || caseTypes.length === 0 ? (
        <EmptyState
          icon={<FileSpreadsheet className="h-8 w-8 text-slate-400" />}
          title="Belum Ada Case Type"
          description="Belum ada tipe case yang terdaftar di sistem."
          action={
            isAdmin && (
              <Button variant="primary" onClick={handleOpenDialog}>
                Tambah Case Type Pertama
              </Button>
            )
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-56">Kode Tipe</TableHead>
              <TableHead className="w-64">Nama Tipe</TableHead>
              <TableHead>Deskripsi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {caseTypes.map((ct) => (
              <TableRow key={ct.id}>
                <TableCell className="font-mono font-medium text-slate-900">
                  {ct.code}
                </TableCell>
                <TableCell className="font-medium text-slate-800">
                  {ct.name}
                </TableCell>
                <TableCell className="text-slate-500">
                  {ct.description || "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Dialog Tambah Case Type */}
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Tambah Case Type Baru"
        description="Daftarkan tipe case baru yang dapat dipilih saat membuat case."
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
              Simpan Case Type
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

          <FormField
            label="Kode Case Type"
            id="ct-code"
            required
            hint="Contoh: SETTLEMENT_EXCEPTION, CREDIT_OVERRIDE"
          >
            <Input
              id="ct-code"
              placeholder="SETTLEMENT_EXCEPTION"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              disabled={createMutation.isPending}
            />
          </FormField>

          <FormField label="Nama Tipe" id="ct-name" required>
            <Input
              id="ct-name"
              placeholder="Settlement Exception"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={createMutation.isPending}
            />
          </FormField>

          <FormField label="Deskripsi (Opsional)" id="ct-desc">
            <Textarea
              id="ct-desc"
              placeholder="Keterangan alur dan skenario penggunaan..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={createMutation.isPending}
              rows={3}
            />
          </FormField>
        </form>
      </Dialog>
    </ContentContainer>
  );
}
