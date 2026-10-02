import { PageHeader } from "@/components/layout/PageHeader";
import { ContentContainer } from "@/components/layout/ContentContainer";

export default function CaseDetailPage({
  params,
}: {
  params: { caseId: string };
}) {
  return (
    <ContentContainer>
      <PageHeader
        title={`Detail Case #${params.caseId}`}
        description="Ringkasan workflow, bukti, analisis AI, dan riwayat persetujuan."
      />
    </ContentContainer>
  );
}
