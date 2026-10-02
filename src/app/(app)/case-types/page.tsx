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
        err instanceof Error ? err.message : "Failed to create case type.";
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
      setFormError("Case type code and name are required.");
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
        title="Case Type Management"
        description="Case type definitions and workflow process templates for Sentinel governance."
        action={
          isAdmin && (
            <Button variant="primary" onClick={handleOpenDialog}>
              <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Add Case Type
            </Button>
          )
        }
      />

      {isLoading ? (
        <LoadingState label="Loading case types..." />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !caseTypes || caseTypes.length === 0 ? (
        <EmptyState
          icon={<FileSpreadsheet className="h-8 w-8 text-slate-400" />}
          title="No Case Types Found"
          description="No case types have been registered in the system yet."
          action={
            isAdmin && (
              <Button variant="primary" onClick={handleOpenDialog}>
                Add First Case Type
              </Button>
            )
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-56">Type Code</TableHead>
              <TableHead className="w-64">Type Name</TableHead>
              <TableHead>Description</TableHead>
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
        title="Add New Case Type"
        description="Register a new case type that can be selected when creating cases."
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              isLoading={createMutation.isPending}
            >
              Save Case Type
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <Alert variant="destructive" title="Save Failed">
              {formError}
            </Alert>
          )}

          <FormField
            label="Case Type Code"
            id="ct-code"
            required
            hint="Example: SETTLEMENT_EXCEPTION, CREDIT_OVERRIDE"
          >
            <Input
              id="ct-code"
              placeholder="SETTLEMENT_EXCEPTION"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              disabled={createMutation.isPending}
            />
          </FormField>

          <FormField label="Type Name" id="ct-name" required>
            <Input
              id="ct-name"
              placeholder="Settlement Exception"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={createMutation.isPending}
            />
          </FormField>

          <FormField label="Description (Optional)" id="ct-desc">
            <Textarea
              id="ct-desc"
              placeholder="Description of workflow and usage scenarios..."
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
