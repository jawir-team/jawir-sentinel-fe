import { PageHeader } from "@/components/layout/PageHeader";
import { ContentContainer } from "@/components/layout/ContentContainer";

export default function NewPolicyPage() {
  return (
    <ContentContainer>
      <PageHeader
        title="Create New Policy"
        description="Register a new policy rule in the Sentinel regulatory repository."
      />
    </ContentContainer>
  );
}
