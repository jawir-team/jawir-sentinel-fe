"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, LogIn, UserCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { Alert } from "@/components/ui/Alert";
import { useAuth } from "@/features/auth/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { user, login, loading: authLoading } = useAuth();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!authLoading && user) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  async function handleLogin(targetEmail: string, targetPass: string) {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await login(targetEmail, targetPass);
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to sign in. Please check your email and password.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage("Please enter your email.");
      return;
    }
    handleLogin(email, password || "sentinel123");
  };

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("sentinel123");
    handleLogin(demoEmail, "sentinel123");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-md shadow-xl border-slate-200">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
            <ShieldCheck className="h-8 w-8" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
            JAWIR Sentinel
          </CardTitle>
          <CardDescription>
            AI-Assisted Governed Decision Workflow for Financial Operations
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4 space-y-5">
          {errorMessage && (
            <Alert variant="destructive" title="Authentication Failed">
              {errorMessage}
            </Alert>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <FormField label="User Email" id="email" required>
              <Input
                id="email"
                type="email"
                placeholder="name@jawir.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                autoComplete="email"
              />
            </FormField>

            <FormField label="Password" id="password" required>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                autoComplete="current-password"
              />
            </FormField>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isSubmitting}
            >
              <LogIn className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Sign In to Sentinel
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-medium">
                Select Demo Persona
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="justify-start text-xs font-normal"
              onClick={() => handleQuickLogin("ops@jawir.local")}
              disabled={isSubmitting}
            >
              <UserCheck className="h-3.5 w-3.5 mr-1.5 text-blue-600" aria-hidden="true" />
              Maker (Ops)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="justify-start text-xs font-normal"
              onClick={() => handleQuickLogin("risk@jawir.local")}
              disabled={isSubmitting}
            >
              <UserCheck className="h-3.5 w-3.5 mr-1.5 text-amber-600" aria-hidden="true" />
              Checker (Risk)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="justify-start text-xs font-normal"
              onClick={() => handleQuickLogin("manager@jawir.local")}
              disabled={isSubmitting}
            >
              <UserCheck className="h-3.5 w-3.5 mr-1.5 text-emerald-600" aria-hidden="true" />
              Signer (Manager)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="justify-start text-xs font-normal"
              onClick={() => handleQuickLogin("admin@jawir.local")}
              disabled={isSubmitting}
            >
              <UserCheck className="h-3.5 w-3.5 mr-1.5 text-purple-600" aria-hidden="true" />
              Sentinel Admin
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
