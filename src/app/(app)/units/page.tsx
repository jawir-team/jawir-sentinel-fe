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
import { getUnits, createUnit } from "@/services/api/units";
import { queryKeys } from "@/constants/queryKeys";
import { useAuth } from "@/features/auth/context/AuthContext";
import { Plus, Building2 } from "lucide-react";

export default function UnitsPage() {
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [formError, setFormError] = React.useState<string | null>(null);

  const { data: units, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.units(),
    queryFn: getUnits,
  });

  const createMutation = useMutation({
    mutationFn: createUnit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.units() });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Gagal membuat unit.";
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
      setFormError("Kode dan nama unit wajib diisi.");
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
        title="Manajemen Unit Kerja"
        description="Daftar unit organisasi Sentinel yang digunakan untuk penugasan partisipan dan tata kelola."
        action={
          isAdmin && (
            <Button variant="primary" onClick={handleOpenDialog}>
              <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Tambah Unit
            </Button>
          )
        }
      />

      {isLoading ? (
        <LoadingState label="Memuat data unit..." />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !units || units.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-8 w-8 text-slate-400" />}
          title="Belum Ada Unit"
          description="Belum ada unit kerja yang terdaftar di sistem."
          action={
            isAdmin && (
              <Button variant="primary" onClick={handleOpenDialog}>
                Tambah Unit Pertama
              </Button>
            )
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">Kode</TableHead>
              <TableHead className="w-64">Nama Unit</TableHead>
              <TableHead>Deskripsi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {units.map((unit) => (
              <TableRow key={unit.id}>
                <TableCell className="font-mono font-medium text-slate-900">
                  {unit.code}
                </TableCell>
                <TableCell className="font-medium text-slate-800">
                  {unit.name}
                </TableCell>
                <TableCell className="text-slate-500">
                  {unit.description || "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Dialog Tambah Unit */}
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Tambah Unit Baru"
        description="Daftarkan unit kerja baru ke dalam sistem."
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
              Simpan Unit
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

          <FormField label="Kode Unit" id="unit-code" required hint="Contoh: OPS, RISK, FIN">
            <Input
              id="unit-code"
              placeholder="OPS"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              disabled={createMutation.isPending}
              maxLength={10}
            />
          </FormField>

          <FormField label="Nama Unit" id="unit-name" required>
            <Input
              id="unit-name"
              placeholder="Operations"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={createMutation.isPending}
            />
          </FormField>

          <FormField label="Deskripsi (Opsional)" id="unit-desc">
            <Textarea
              id="unit-desc"
              placeholder="Penjelasan fungsi unit..."
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
