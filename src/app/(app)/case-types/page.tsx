import { PageHeader } from "@/components/layout/PageHeader";
import { ContentContainer } from "@/components/layout/ContentContainer";

export default function CaseTypesPage() {
  return (
    <ContentContainer>
      <PageHeader
        title="Manajemen Case Types"
        description="Kelola kategori case, template SLA, dan konfigurasi workflow."
      />
    </ContentContainer>
  );
}
