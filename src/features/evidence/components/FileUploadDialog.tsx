"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { Dialog } from "@/components/ui/Dialog";
import { Alert } from "@/components/ui/Alert";
import {
  getEvidenceUploadUrl,
  uploadFileToSignedUrl,
  registerFileEvidence,
} from "@/services/api/evidences";
import { queryKeys } from "@/constants/queryKeys";
import { Upload, FileUp, CheckCircle, AlertTriangle, ShieldCheck } from "lucide-react";

export interface FileUploadDialogProps {
  caseId: string;
  isOpen: boolean;
  onClose: () => void;
}

const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];

export function FileUploadDialog({
  caseId,
  isOpen,
  onClose,
}: FileUploadDialogProps) {
  const queryClient = useQueryClient();

  const [title, setTitle] = React.useState("");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [uploadStep, setUploadStep] = React.useState<
    "idle" | "requesting_url" | "uploading_gcs" | "registering" | "done"
  >("idle");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const resetState = () => {
    setTitle("");
    setSelectedFile(null);
    setUploadStep("idle");
    setErrorMessage(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setErrorMessage(
        "Unsupported file type. Formats allowed for Gemini AI analysis: PDF, JPEG, and PNG."
      );
      setSelectedFile(null);
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage("Please select an evidence file first.");
      return;
    }
    if (!title.trim()) {
      setErrorMessage("Evidence document title is required.");
      return;
    }

    setErrorMessage(null);

    try {
      // Step 1: Request signed URL from Sentinel backend
      setUploadStep("requesting_url");
      const { upload_url, file_key } = await getEvidenceUploadUrl(caseId, {
        file_name: selectedFile.name,
        mime_type: selectedFile.type,
      });

      // Step 2: Upload direct to Cloud Storage via signed URL
      setUploadStep("uploading_gcs");
      await uploadFileToSignedUrl(upload_url, selectedFile);

      // Step 3: Register verified GCS key with Sentinel backend
      setUploadStep("registering");
      await registerFileEvidence(caseId, {
        file_key,
        title: title.trim(),
        evidence_type: "DOCUMENT",
      });

      setUploadStep("done");
      queryClient.invalidateQueries({ queryKey: queryKeys.evidences(caseId) });
      onClose();
      resetState();
    } catch (err: unknown) {
      setUploadStep("idle");
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to upload evidence file. Case workflow status may have changed (stale state).";
      setErrorMessage(msg);
    }
  };

  const isUploading = uploadStep !== "idle" && uploadStep !== "done";

  const getStepText = () => {
    switch (uploadStep) {
      case "requesting_url":
        return "1/3 Requesting Signed URL from Sentinel API...";
      case "uploading_gcs":
        return "2/3 Uploading file directly to Google Cloud Storage...";
      case "registering":
        return "3/3 Registering evidence with Sentinel API...";
      default:
        return "Uploading...";
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={isUploading ? () => {} : onClose}
      title="Upload Evidence File (Direct-to-GCS)"
      description="Upload transaction documents or approval records for Sentinel AI verification."
      footer={
        <>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUploadSubmit}
            isLoading={isUploading}
            disabled={!selectedFile || !title.trim()}
          >
            <Upload className="h-4 w-4 mr-1.5" />
            {isUploading ? "Processing..." : "Start Upload"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleUploadSubmit} className="space-y-4">
        {errorMessage && (
          <Alert variant="destructive" title="Upload Error">
            <div className="flex items-center gap-2 mt-1">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          </Alert>
        )}

        <div className="rounded-lg bg-blue-50/50 p-3 border border-blue-100 text-xs text-blue-900 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <span>Supported Formats for Gemini AI</span>
          </div>
          <p className="text-[11px] text-blue-800">
            Only files in <strong>PDF, JPEG, or PNG</strong> format can be
            ingested and analyzed directly by Vertex AI Gemini.
          </p>
        </div>

        <FormField label="Evidence Document Title" id="upload-title" required>
          <Input
            id="upload-title"
            placeholder="Example: Cutoff Reconciliation Log"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isUploading}
          />
        </FormField>

        <FormField
          label="Select File (PDF, JPG, PNG)"
          id="upload-file"
          required
          hint="Maximum file size: 25MB"
        >
          <Input
            id="upload-file"
            type="file"
            accept=".pdf,image/jpeg,image/png"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </FormField>

        {selectedFile && (
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileUp className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-slate-800 truncate max-w-xs">
                {selectedFile.name}
              </span>
            </div>
            <span className="font-mono text-slate-500">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
        )}

        {isUploading && (
          <div className="rounded-lg bg-blue-50 p-3 border border-blue-200 text-xs text-blue-900 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-blue-600 animate-spin" />
            <span className="font-medium">{getStepText()}</span>
          </div>
        )}
      </form>
    </Dialog>
  );
}
