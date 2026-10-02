"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PolicyReference } from "@/types/analysis";
import { EvidenceItem } from "@/types/evidence";
import { BookOpen, Paperclip, ShieldCheck, Info, ExternalLink, Calendar, User } from "lucide-react";
import Link from "next/link";

interface ReferenceViewerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  policyRef?: PolicyReference | null;
  evidenceRefId?: string | null;
  evidenceUsageType?: string | null;
  allEvidences?: EvidenceItem[];
}

export function ReferenceViewerDialog({
  isOpen,
  onClose,
  policyRef,
  evidenceRefId,
  evidenceUsageType,
  allEvidences = [],
}: ReferenceViewerDialogProps) {
  if (!isOpen) return null;

  // Viewing a Policy Reference
  if (policyRef) {
    return (
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        title={`Policy Reference: ${policyRef.policy_code}`}
        description="Specific policy clause details evaluated in this analysis."
        footer={
          <div className="flex justify-between w-full">
            <Link
              href={`/policies/${policyRef.policy_id}`}
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Open Full Policy Document</span>
            </Link>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          {/* Historical policy notice */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2.5 text-blue-900">
            <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Policy Provenance Integrity (Audit Trail)</p>
              <p className="text-[11px] text-blue-800 mt-0.5 leading-relaxed">
                This clause references policy version <strong>v{policyRef.version}</strong> active when the analysis was performed. Subsequent policy versions do not alter this historical audit record.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div>
                <span className="text-slate-400 block mb-0.5 text-[11px]">Policy Title</span>
                <span className="font-semibold text-slate-800">{policyRef.policy_title}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5 text-[11px]">Associated Version</span>
                <span className="font-mono font-medium text-slate-700">v{policyRef.version}</span>
              </div>
              {policyRef.section && (
                <div className="col-span-2 pt-2 border-t border-slate-200">
                  <span className="text-slate-400 block mb-0.5 text-[11px]">Section / Clause</span>
                  <span className="font-semibold text-slate-800">{policyRef.section}</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5 pt-2">
              <span className="font-bold uppercase tracking-wider text-slate-600 text-[11px] block">
                Clause Excerpt Text:
              </span>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800 text-xs leading-relaxed whitespace-pre-wrap">
                &ldquo;{policyRef.excerpt}&rdquo;
              </div>
            </div>

            <div className="pt-2 text-[10px] font-mono text-slate-400 flex flex-col gap-0.5">
              <span>Policy ID: {policyRef.policy_id}</span>
              <span>Version ID: {policyRef.policy_version_id}</span>
            </div>
          </div>
        </div>
      </Dialog>
    );
  }

  // Viewing an Evidence Reference
  if (evidenceRefId) {
    const matchedEvidence = allEvidences.find((e) => e.id === evidenceRefId);

    return (
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        title={`Referenced Evidence: ${evidenceRefId}`}
        description="Supporting evidence details utilized as factual ground for AI analysis."
        footer={
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-slate-500" />
              <span className="font-mono font-bold text-slate-800">{evidenceRefId}</span>
            </div>
            {evidenceUsageType && (
              <Badge variant="secondary" className="font-mono text-[10px]">
                {evidenceUsageType}
              </Badge>
            )}
          </div>

          {matchedEvidence ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <span className="font-semibold text-slate-800 text-sm">
                  {matchedEvidence.title}
                </span>
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {matchedEvidence.content}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-[11px]">
                <div>
                  <span className="text-slate-400 block mb-0.5">Evidence Type</span>
                  <Badge variant="outline" className="font-mono">
                    {matchedEvidence.evidence_type}
                  </Badge>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Source</span>
                  <div className="flex items-center gap-1 text-slate-700">
                    <User className="h-3 w-3 text-slate-400" />
                    <span>{matchedEvidence.source_user?.name || matchedEvidence.source_type}</span>
                  </div>
                </div>
                {matchedEvidence.file_path && (
                  <div className="col-span-2 pt-2 border-t border-slate-200">
                    <span className="text-slate-400 block mb-0.5">Attached File</span>
                    <span className="font-mono text-slate-700 break-all">
                      {matchedEvidence.file_path} ({matchedEvidence.mime_type})
                    </span>
                  </div>
                )}
                <div className="col-span-2 pt-2 border-t border-slate-200">
                  <span className="text-slate-400 block mb-0.5">Recorded At</span>
                  <span className="font-mono text-slate-600">
                    {new Date(matchedEvidence.created_at).toLocaleString("en-US")}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 space-y-1">
              <p className="font-medium text-slate-800">
                Evidence recorded as analysis reference ({evidenceRefId}).
              </p>
              <p className="text-[11px] text-slate-500">
                Full evidence details can be viewed in the Evidence tab for this case.
              </p>
            </div>
          )}
        </div>
      </Dialog>
    );
  }

  return null;
}
