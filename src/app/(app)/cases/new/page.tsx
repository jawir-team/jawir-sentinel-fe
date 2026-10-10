"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { ContentContainer } from "@/components/layout/ContentContainer";
import { CaseForm } from "@/features/case/components/CaseForm";
import { createCase } from "@/services/api/cases";
import { queryKeys } from "@/constants/queryKeys";
import { Urgency } from "@/types/case";

export default function NewCasePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = React.useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: createCase,
    onSuccess: (newCase) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cases() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
      router.push(`/cases/${newCase.id}`);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to create new case.";
      setServerError(msg);
    },
  });

  const handleSubmit = async (values: {
    case_type_id: string;
    title: string;
    description: string;
    urgency: Urgency;
  }) => {
    setServerError(null);
    createMutation.mutate(values);
  };

  return (
    <ContentContainer>
      <PageHeader
        title="Create New Case"
        description="Register an operational financial anomaly to be processed by the JAWIR Sentinel governance workflow."
      />
      <div className="flex justify-center">
        <CaseForm
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending}
          serverError={serverError}
        />
      </div>
    </ContentContainer>
  );
}
