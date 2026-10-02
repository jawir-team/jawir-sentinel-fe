import { PageHeader } from "@/components/layout/PageHeader";
import { ContentContainer } from "@/components/layout/ContentContainer";

export default function NewCasePage() {
  return (
    <ContentContainer>
      <PageHeader
        title="Buat Case Baru"
        description="Daftarkan case baru untuk diproses oleh workflow JAWIR Sentinel."
      />
    </ContentContainer>
  );
}
