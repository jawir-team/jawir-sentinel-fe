import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/feedback/EmptyState";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-50">
      <EmptyState
        icon={<FileQuestion className="h-8 w-8 text-slate-400" />}
        title="404 - Page Not Found"
        description="The page you are looking for does not exist or the URL is incorrect."
        action={
          <Link href="/dashboard">
            <Button variant="primary">Back to Dashboard</Button>
          </Link>
        }
      />
    </div>
  );
}
