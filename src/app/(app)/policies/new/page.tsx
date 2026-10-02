import { PageHeader } from "@/components/layout/PageHeader";
import { ContentContainer } from "@/components/layout/ContentContainer";

export default function NewPolicyPage() {
  return (
    <ContentContainer>
      <PageHeader
        title="Buat Policy Baru"
        description="Daftarkan aturan kebijakan baru ke dalam database regulasi Sentinel."
      />
    </ContentContainer>
  );
}
