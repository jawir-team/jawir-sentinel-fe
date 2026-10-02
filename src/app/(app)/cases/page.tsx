import { PageHeader } from "@/components/layout/PageHeader";
import { ContentContainer } from "@/components/layout/ContentContainer";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";

export default function CasesPage() {
  return (
    <ContentContainer>
      <PageHeader
        title="Daftar Cases"
        description="Kelola dan pantau seluruh governance workflow case."
        action={
          <Link href="/cases/new">
            <Button variant="primary" size="md">
              <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
              Buat Case
            </Button>
          </Link>
        }
      />
    </ContentContainer>
  );
}
