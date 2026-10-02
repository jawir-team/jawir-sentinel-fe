"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { useAuth } from "@/features/auth/context/AuthContext";
import { LoadingState } from "@/components/feedback/LoadingState";
import { Button } from "@/components/ui/Button";
import { LogOut } from "lucide-react";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  React.useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <LoadingState label="Memeriksa sesi pengguna..." />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const userSection = (
    <div className="flex items-center gap-3">
      <div className="text-right hidden sm:block">
        <p className="text-sm font-semibold text-slate-800 leading-none">
          {user.displayName || user.email?.split("@")[0] || "User"}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => logout()}
        className="text-slate-600 hover:text-red-600 gap-1"
        title="Keluar dari akun"
        aria-label="Keluar dari akun"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        <span className="hidden md:inline">Keluar</span>
      </Button>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <AppHeader userSection={userSection} />
      <div className="flex flex-1">
        <AppSidebar />
        <main className="flex-1 overflow-x-hidden min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}
