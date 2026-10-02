import { PageHeader } from "@/components/layout/PageHeader";
import { ContentContainer } from "@/components/layout/ContentContainer";

export default function UsersPage() {
  return (
    <ContentContainer>
      <PageHeader
        title="Manajemen Pengguna"
        description="Kelola pengguna internal JAWIR Sentinel dan penugasan unit kerja."
      />
    </ContentContainer>
  );
}
