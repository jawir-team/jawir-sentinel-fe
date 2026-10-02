import { PageHeader } from "@/components/layout/PageHeader";
import { ContentContainer } from "@/components/layout/ContentContainer";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";

export default function PoliciesPage() {
  return (
    <ContentContainer>
      <PageHeader
        title="Daftar Policy"
        description="Kelola aturan kebijakan Sentinel dan versi berlakunya."
        action={
          <Link href="/policies/new">
            <Button variant="primary" size="md">
              <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
              Buat Policy
            </Button>
          </Link>
        }
      />
    </ContentContainer>
  );
}
