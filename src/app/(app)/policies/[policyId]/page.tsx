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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { LoadingState } from "@/components/feedback/LoadingState";
import { ErrorState } from "@/components/feedback/ErrorState";
import {
  PolicyAuthorityBadge,
  PolicyIndexBadge,
} from "@/features/policy/components/PolicyBadges";
import {
  getPolicyById,
  createPolicyVersion,
  activatePolicyVersion,
  recoverPolicyIndexing,
} from "@/services/api/policies";
import { queryKeys } from "@/constants/queryKeys";
import { useAuth } from "@/features/auth/context/AuthContext";
import { PolicyVersion } from "@/types/policy";
import { Plus, Check, RefreshCw, AlertTriangle, Clock, Calendar, FileText } from "lucide-react";

export default function PolicyDetailPage({
  params,
}: {
  params: { policyId: string };
}) {
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();

  // Create Version Dialog
  const [isAddVerOpen, setIsAddVerOpen] = React.useState(false);
  const [verNumber, setVerNumber] = React.useState("");
  const [verContent, setVerContent] = React.useState("");
  const [effectiveFrom, setEffectiveFrom] = React.useState("");
  const [effectiveUntil, setEffectiveUntil] = React.useState("");
  const [addVerError, setAddVerError] = React.useState<string | null>(null);

  // Global action error message
  const [actionError, setActionError] = React.useState<string | null>(null);

  const {
    data: policy,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.policy(params.policyId),
    queryFn: () => getPolicyById(params.policyId),
  });

  const createVerMutation = useMutation({
    mutationFn: (payload: {
      version: string;
      content: string;
      effective_from?: string;
      effective_until?: string;
    }) => createPolicyVersion(params.policyId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.policy(params.policyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.policies() });
      setIsAddVerOpen(false);
      resetVerForm();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to create policy version.";
      setAddVerError(msg);
    },
  });

  const activateMutation = useMutation({
    mutationFn: (versionId: string) =>
      activatePolicyVersion(params.policyId, versionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.policy(params.policyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.policies() });
      setActionError(null);
    },
    onError: (err: unknown) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.policy(params.policyId) });
      const msg = err instanceof Error ? err.message : "Failed to activate policy version.";
      setActionError(msg);
    },
  });

  const recoverMutation = useMutation({
    mutationFn: (versionId: string) =>
      recoverPolicyIndexing(params.policyId, versionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.policy(params.policyId) });
      setActionError(null);
    },
    onError: (err: unknown) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.policy(params.policyId) });
      const msg = err instanceof Error ? err.message : "Failed to recover indexing process.";
      setActionError(msg);
    },
  });

  const resetVerForm = () => {
    setVerNumber("");
    setVerContent("");
    setEffectiveFrom(new Date().toISOString().slice(0, 16));
    setEffectiveUntil("");
    setAddVerError(null);
  };

  const handleOpenAddVer = () => {
    resetVerForm();
    setIsAddVerOpen(true);
  };

  const handleAddVerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verNumber.trim() || !verContent.trim()) {
      setAddVerError("Version number and policy text content are required.");
      return;
    }
    createVerMutation.mutate({
      version: verNumber.trim(),
      content: verContent.trim(),
      effective_from: effectiveFrom ? new Date(effectiveFrom).toISOString() : undefined,
      effective_until: effectiveUntil ? new Date(effectiveUntil).toISOString() : undefined,
    });
  };

  if (isLoading) {
    return (
      <ContentContainer>
        <LoadingState label="Loading policy..." />
      </ContentContainer>
    );
  }

  if (isError || !policy) {
    return (
      <ContentContainer>
        <ErrorState
          title="Policy Not Found"
          message="Failed to load policy details."
          onRetry={() => refetch()}
        />
      </ContentContainer>
    );
  }

  const now = new Date();

  return (
    <ContentContainer>
      <PageHeader
        title={`${policy.code} - ${policy.title}`}
        description={policy.description}
        badge={
          policy.active_version ? (
            <PolicyAuthorityBadge status={policy.active_version.status} />
          ) : undefined
        }
        action={
          isAdmin && (
            <Button variant="primary" onClick={handleOpenAddVer}>
              <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Create New Version
            </Button>
          )
        }
      />

      {actionError && (
        <Alert variant="destructive" title="Action Failed" className="mb-6">
          {actionError}
        </Alert>
      )}

      {/* Policy Meta Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="border-slate-200">
          <CardContent className="p-4 text-xs space-y-1">
            <span className="text-slate-400 block font-medium">Regulatory Domain</span>
            <span className="font-mono text-sm font-semibold text-slate-900">
              {policy.domain}
            </span>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4 text-xs space-y-1">
            <span className="text-slate-400 block font-medium">Associated Case Type</span>
            <span className="text-sm font-semibold text-slate-900">
              {policy.case_type?.name} ({policy.case_type?.code})
            </span>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4 text-xs space-y-1">
            <span className="text-slate-400 block font-medium">Active Version</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono font-bold text-sm text-slate-800">
                {policy.active_version ? `v${policy.active_version.version}` : "None"}
              </span>
              {policy.active_version && (
                <PolicyIndexBadge status={policy.active_version.index_status} />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Policy Versions Timeline / List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            Policy Version History ({policy.versions.length})
          </h2>
          <span className="text-xs text-slate-500">
            Only ACTIVE versions are utilized by Sentinel for AI evaluations.
          </span>
        </div>

        {policy.versions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 bg-slate-50">
            No policy versions have been created yet. Click the button above to create the initial version.
          </div>
        ) : (
          <div className="space-y-4">
            {policy.versions.map((ver) => {
              const isFuture = ver.effective_from && new Date(ver.effective_from) > now;
              const isExpired = ver.effective_until && new Date(ver.effective_until) <= now;
              const canActivateTime = !isFuture && !isExpired;

              return (
                <Card
                  key={ver.id}
                  className={`border transition-all ${
                    ver.status === "ACTIVE"
                      ? "border-emerald-300 ring-1 ring-emerald-500/20 bg-emerald-50/10 shadow-sm"
                      : "border-slate-200"
                  }`}
                >
                  <CardHeader className="py-4 border-b border-slate-100">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-base text-slate-900">
                          Version {ver.version}
                        </span>
                        <PolicyAuthorityBadge status={ver.status} />
                        <PolicyIndexBadge status={ver.index_status} />
                      </div>

                      {/* Admin Actions */}
                      {isAdmin && ver.status === "DRAFT" && (
                        <div className="flex items-center gap-2 shrink-0">
                          {/* If processing and recoverable */}
                          {ver.index_status === "PROCESSING" && ver.index_recoverable && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => recoverMutation.mutate(ver.id)}
                              isLoading={recoverMutation.isPending}
                              className="text-amber-700 border-amber-300 hover:bg-amber-50"
                            >
                              <RefreshCw className="h-3.5 w-3.5 mr-1" />
                              Recover Indexing
                            </Button>
                          )}

                          {ver.index_status === "PROCESSING" && !ver.index_recoverable && (
                            <Button variant="outline" size="sm" disabled>
                              <Clock className="h-3.5 w-3.5 mr-1 animate-spin" />
                              Indexing...
                            </Button>
                          )}

                          {/* If not processing */}
                          {ver.index_status !== "PROCESSING" && (
                            <Button
                              variant={ver.index_status === "READY" ? "primary" : "secondary"}
                              size="sm"
                              onClick={() => activateMutation.mutate(ver.id)}
                              isLoading={activateMutation.isPending}
                              disabled={!canActivateTime}
                              title={
                                isFuture
                                  ? "Version not yet effective (future-effective)"
                                  : isExpired
                                  ? "Version has expired"
                                  : "Set as official active version"
                              }
                            >
                              <Check className="h-3.5 w-3.5 mr-1" />
                              {ver.index_status === "READY"
                                ? "Activate Version"
                                : "Activate & Index"}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="py-4 space-y-4 text-xs">
                    {/* Diagnostic error if failed */}
                    {ver.index_status === "FAILED" && ver.index_error && (
                      <Alert variant="destructive" title="Vector Indexing Failure">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                          <span>{ver.index_error}</span>
                        </div>
                      </Alert>
                    )}

                    {/* Window Effective warning */}
                    {!canActivateTime && ver.status === "DRAFT" && (
                      <Alert variant="warning" title="Validity Period Alert">
                        {isFuture &&
                          `This version cannot be activated yet as it only becomes effective starting ${new Date(
                            ver.effective_from!
                          ).toLocaleString("en-US")}.`}
                        {isExpired && "This version has passed its expiration date."}
                      </Alert>
                    )}

                    {/* Content Text */}
                    <div className="rounded-lg bg-slate-50 p-4 border border-slate-200 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {ver.content}
                    </div>

                    {/* Metadata Footer */}
                    <div className="flex flex-wrap items-center gap-6 pt-2 text-slate-500 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          Effective:{" "}
                          {ver.effective_from
                            ? new Date(ver.effective_from).toLocaleDateString("en-US")
                            : "Now"}{" "}
                          to{" "}
                          {ver.effective_until
                            ? new Date(ver.effective_until).toLocaleDateString("en-US")
                            : "Indefinite"}
                        </span>
                      </div>

                      {ver.indexed_at && (
                        <div className="flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span>
                            Indexed at: {new Date(ver.indexed_at).toLocaleTimeString("en-US")}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          Created: {new Date(ver.created_at).toLocaleString("en-US")}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialog Buat Versi Baru */}
      <Dialog
        isOpen={isAddVerOpen}
        onClose={() => setIsAddVerOpen(false)}
        title={`Create New Version: ${policy.code}`}
        description="New versions are created in DRAFT status. The existing ACTIVE version remains in effect until this version is activated."
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setIsAddVerOpen(false)}
              disabled={createVerMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAddVerSubmit}
              isLoading={createVerMutation.isPending}
            >
              Save DRAFT Version
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddVerSubmit} className="space-y-4">
          {addVerError && (
            <Alert variant="destructive" title="Failed to Save Version">
              {addVerError}
            </Alert>
          )}

          <FormField
            label="Version Number"
            id="ver-num"
            required
            hint="Example: 1.1, 2.0-REVISED"
          >
            <Input
              id="ver-num"
              placeholder="2.0"
              value={verNumber}
              onChange={(e) => setVerNumber(e.target.value)}
              disabled={createVerMutation.isPending}
            />
          </FormField>

          <FormField
            label="Policy Text / Full Clauses"
            id="ver-content"
            required
            hint="Rule clauses to be ingested and indexed by Sentinel AI."
          >
            <Textarea
              id="ver-content"
              rows={8}
              placeholder="Specify policy rules, cutoff thresholds, and operational instructions..."
              value={verContent}
              onChange={(e) => setVerContent(e.target.value)}
              disabled={createVerMutation.isPending}
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Effective From" id="ver-from">
              <Input
                id="ver-from"
                type="datetime-local"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                disabled={createVerMutation.isPending}
              />
            </FormField>

            <FormField label="Effective Until (Optional)" id="ver-until">
              <Input
                id="ver-until"
                type="datetime-local"
                value={effectiveUntil}
                onChange={(e) => setEffectiveUntil(e.target.value)}
                disabled={createVerMutation.isPending}
              />
            </FormField>
          </div>
        </form>
      </Dialog>
    </ContentContainer>
  );
}
