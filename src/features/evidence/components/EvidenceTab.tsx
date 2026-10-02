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
import { FileUploadDialog } from "./FileUploadDialog";
import {
  FileText,
  Paperclip,
  Plus,
  Lock,
  Calendar,
  User,
  ShieldCheck,
  FileCode,
  UploadCloud,
} from "lucide-react";

export interface EvidenceTabProps {
  caseData: CaseDetail;
}

export function EvidenceTab({ caseData }: EvidenceTabProps) {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);
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
      const msg = err instanceof Error ? err.message : "Failed to add evidence record.";
      setFormError(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setFormError("Evidence title and content are required.");
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
            Evidence & Case Context Documents
          </h2>
          <p className="text-xs text-slate-500">
            Supporting evidence considered by Sentinel AI and human verifiers.
          </p>
        </div>

        {canAddEvidence ? (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsUploadOpen(true)}
            >
              <UploadCloud className="h-4 w-4 mr-1.5 text-blue-600" aria-hidden="true" />
              Upload File (PDF/JPG/PNG)
            </Button>
            <Button variant="primary" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Add Note
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            Evidence Ingestion Locked ({caseData.status})
          </div>
        )}
      </div>

      {isLoading ? (
        <LoadingState label="Loading evidence documents..." />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !evidences || evidences.length === 0 ? (
        <EmptyState
          icon={<Paperclip className="h-8 w-8 text-slate-400" />}
          title="No Evidence Documents"
          description={
            canAddEvidence
              ? "Add transaction evidence, audit trails, or supporting notes to validate this case."
              : "No evidence documents have been attached to this case yet."
          }
          action={
            canAddEvidence && (
              <Button variant="primary" onClick={() => setIsDialogOpen(true)}>
                Add First Evidence
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
                      <span>Type: {ev.evidence_type}</span>
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
                    <span>By: {ev.source_user?.name || "System"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(ev.created_at).toLocaleString("en-US")}</span>
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
        title="Add Supporting Evidence Note"
        description="Include additional factual context for consideration by verifiers."
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
              Save Evidence
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

          <div className="rounded-lg bg-blue-50/50 p-3 border border-blue-100 text-xs text-blue-800 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <span>Evidence Ingestion Authorization</span>
            </div>
            <p className="text-[11px] text-blue-700">
              Uploader role is automatically mapped from your active workflow assignment for this case.
            </p>
          </div>

          <FormField label="Evidence Title" id="ev-title" required>
            <Input
              id="ev-title"
              placeholder="Example: Clearing batch failure log #402"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={createMutation.isPending}
            />
          </FormField>

          <FormField
            label="Notes & Factual Context"
            id="ev-content"
            required
            hint="Specify transaction reference numbers or internal communication records."
          >
            <Textarea
              id="ev-content"
              rows={5}
              placeholder="Provide factual details..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={createMutation.isPending}
            />
          </FormField>
        </form>
      </Dialog>

      <FileUploadDialog
        caseId={caseData.id}
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </div>
  );
}
