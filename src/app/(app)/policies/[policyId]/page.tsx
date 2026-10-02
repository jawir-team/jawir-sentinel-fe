import { PageHeader } from "@/components/layout/PageHeader";
import { ContentContainer } from "@/components/layout/ContentContainer";

export default function PolicyDetailPage({
  params,
}: {
  params: { policyId: string };
}) {
  return (
    <ContentContainer>
      <PageHeader
        title={`Detail Policy #${params.policyId}`}
        description="Informasi policy, riwayat versi, dan status aktivasi."
      />
    </ContentContainer>
  );
}
