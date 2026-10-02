import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { ShieldCheck } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-md shadow-lg border-slate-200">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
            <ShieldCheck className="h-7 w-7" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl font-bold">JAWIR Sentinel</CardTitle>
          <CardDescription>
            AI-assisted governed decision workflow for financial operations
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-center text-sm text-slate-500">
            Masuk dengan kredensial Sentinel Anda untuk melanjutkan.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
