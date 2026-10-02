"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { ContentContainer } from "@/components/layout/ContentContainer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
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
import {
  PolicyAuthorityBadge,
  PolicyIndexBadge,
} from "@/features/policy/components/PolicyBadges";
import { getPolicies, createPolicy } from "@/services/api/policies";
import { getCaseTypes } from "@/services/api/caseTypes";
import { queryKeys } from "@/constants/queryKeys";
import { useAuth } from "@/features/auth/context/AuthContext";
import { Plus, BookOpen } from "lucide-react";

export default function PoliciesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();

  // Filters
  const [domainFilter, setDomainFilter] = React.useState("");
  const [caseTypeIdFilter, setCaseTypeIdFilter] = React.useState("");

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [domain, setDomain] = React.useState("SETTLEMENT");
  const [caseTypeId, setCaseTypeId] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [dialogError, setDialogError] = React.useState<string | null>(null);

  const { data: caseTypes } = useQuery({
    queryKey: queryKeys.caseTypes(),
    queryFn: getCaseTypes,
  });

  const {
    data: policyResult,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.policies({
      domain: domainFilter,
      case_type_id: caseTypeIdFilter,
    }),
    queryFn: () =>
      getPolicies({
        domain: domainFilter || undefined,
        case_type_id: caseTypeIdFilter || undefined,
      }),
  });

  const policies = policyResult?.data || [];

  const createMutation = useMutation({
    mutationFn: createPolicy,
    onSuccess: (newPolicy) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.policies() });
      setIsDialogOpen(false);
      resetForm();
      router.push(`/policies/${newPolicy.id}`);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to create policy.";
      setDialogError(msg);
    },
  });

  const resetForm = () => {
    setCode("");
    setTitle("");
    setDomain("SETTLEMENT");
    setCaseTypeId(caseTypes?.[0]?.id || "");
    setDescription("");
    setDialogError(null);
  };

  const handleOpenDialog = () => {
    resetForm();
    setCaseTypeId(caseTypes?.[0]?.id || "");
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !title.trim() || !caseTypeId) {
      setDialogError("Code, title, and case type are required.");
      return;
    }
    createMutation.mutate({
      code: code.trim().toUpperCase(),
      title: title.trim(),
      domain: domain.trim().toUpperCase(),
      case_type_id: caseTypeId,
      description: description.trim(),
    });
  };

  return (
    <ContentContainer>
      <PageHeader
        title="Regulations & Policies"
        description="Manage SOPs and operational guidelines that govern Sentinel verification decisions."
        action={
          isAdmin && (
            <Button variant="primary" onClick={handleOpenDialog}>
              <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Add Policy
            </Button>
          )
        }
      />

      {/* Filter Bar */}
      <div className="mb-6 flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="w-44">
          <label htmlFor="filter-domain" className="block text-xs font-semibold text-slate-500 mb-1">
            Regulatory Domain
          </label>
          <Select
            id="filter-domain"
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
          >
            <option value="">All Domains</option>
            <option value="SETTLEMENT">SETTLEMENT</option>
            <option value="CREDIT">CREDIT</option>
            <option value="COMPLIANCE">COMPLIANCE</option>
          </Select>
        </div>

        <div className="w-52">
          <label htmlFor="filter-casetype" className="block text-xs font-semibold text-slate-500 mb-1">
            Case Type
          </label>
          <Select
            id="filter-casetype"
            value={caseTypeIdFilter}
            onChange={(e) => setCaseTypeIdFilter(e.target.value)}
          >
            <option value="">All Case Types</option>
            {caseTypes?.map((ct) => (
              <option key={ct.id} value={ct.id}>
                {ct.name}
              </option>
            ))}
          </Select>
        </div>

        {(domainFilter || caseTypeIdFilter) && (
          <div className="flex items-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDomainFilter("");
                setCaseTypeIdFilter("");
              }}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Reset Filters
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <LoadingState label="Loading policies..." />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : policies.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-8 w-8 text-slate-400" />}
          title="No Policies Found"
          description="No SOPs or regulations have been registered in the system yet."
          action={
            isAdmin && (
              <Button variant="primary" onClick={handleOpenDialog}>
                Add First Policy
              </Button>
            )
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-36">SOP Code</TableHead>
              <TableHead>Policy Title</TableHead>
              <TableHead className="w-32">Domain</TableHead>
              <TableHead className="w-44">Case Type</TableHead>
              <TableHead className="w-48">Active Version</TableHead>
              <TableHead className="w-44">Index Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {policies.map((p) => (
              <TableRow
                key={p.id}
                onClick={() => router.push(`/policies/${p.id}`)}
                className="cursor-pointer hover:bg-blue-50/40 transition-colors"
                tabIndex={0}
                role="button"
                aria-label={`Open policy details ${p.code}: ${p.title}`}
              >
                <TableCell className="font-mono font-semibold text-blue-600">
                  {p.code}
                </TableCell>
                <TableCell className="font-medium text-slate-900">
                  {p.title}
                </TableCell>
                <TableCell className="font-mono text-xs text-slate-600">
                  {p.domain}
                </TableCell>
                <TableCell className="text-xs text-slate-600">
                  {p.case_type?.name}
                </TableCell>
                <TableCell>
                  {p.active_version ? (
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-xs">
                        v{p.active_version.version}
                      </span>
                      <PolicyAuthorityBadge status={p.active_version.status} />
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">No Active Version</span>
                  )}
                </TableCell>
                <TableCell>
                  {p.active_version ? (
                    <PolicyIndexBadge status={p.active_version.index_status} />
                  ) : (
                    <span className="text-xs text-slate-400">-</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Dialog Tambah Policy */}
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Register New Policy"
        description="Add baseline policy metadata before drafting policy versions."
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
              Save Policy
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {dialogError && (
            <Alert variant="destructive" title="Save Failed">
              {dialogError}
            </Alert>
          )}

          <FormField label="Policy Code" id="pol-code" required hint="Example: SOP-OPS-001">
            <Input
              id="pol-code"
              placeholder="SOP-OPS-001"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              disabled={createMutation.isPending}
            />
          </FormField>

          <FormField label="Policy Title" id="pol-title" required>
            <Input
              id="pol-title"
              placeholder="Settlement Exception Handling"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={createMutation.isPending}
            />
          </FormField>

          <FormField label="Regulatory Domain" id="pol-domain" required>
            <Select
              id="pol-domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              disabled={createMutation.isPending}
            >
              <option value="SETTLEMENT">SETTLEMENT</option>
              <option value="CREDIT">CREDIT</option>
              <option value="COMPLIANCE">COMPLIANCE</option>
              <option value="TREASURY">TREASURY</option>
            </Select>
          </FormField>

          <FormField label="Associated Case Type" id="pol-casetype" required>
            <Select
              id="pol-casetype"
              value={caseTypeId}
              onChange={(e) => setCaseTypeId(e.target.value)}
              disabled={createMutation.isPending}
            >
              {caseTypes?.map((ct) => (
                <option key={ct.id} value={ct.id}>
                  {ct.name} ({ct.code})
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Brief Description" id="pol-desc">
            <Textarea
              id="pol-desc"
              rows={3}
              placeholder="Purpose and scope of this operational policy..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={createMutation.isPending}
            />
          </FormField>
        </form>
      </Dialog>
    </ContentContainer>
  );
}
