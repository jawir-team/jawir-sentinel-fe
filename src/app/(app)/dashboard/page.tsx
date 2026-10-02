import { PageHeader } from "@/components/layout/PageHeader";
import { ContentContainer } from "@/components/layout/ContentContainer";

export default function DashboardPage() {
  return (
    <ContentContainer>
      <PageHeader
        title="Dashboard"
        description="Ringkasan status case dan antrean tindakan Anda."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Dashboard cards placeholder */}
      </div>
    </ContentContainer>
  );
}
