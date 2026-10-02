"use client";

import * as React from "react";
import {
  signInWithEmail,
  signOutUser,
  getFirebaseIdToken,
  onAuthStateChange,
  SentinelAuthUser,
} from "@/services/firebase/auth";
import {
  setAuthTokenProvider,
  setUnauthorizedHandler,
} from "@/services/api/client";

interface AuthContextType {
  user: SentinelAuthUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<SentinelAuthUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Inject auth token provider into API client
    setAuthTokenProvider(async () => {
      return await getFirebaseIdToken();
    });

    // Inject unauthorized 401 retry handler
    setUnauthorizedHandler(async () => {
      const token = await getFirebaseIdToken(true);
      return !!token;
    });

    const unsubscribe = onAuthStateChange((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = React.useCallback(async (email: string, pass: string) => {
    setError(null);
    try {
      const loggedUser = await signInWithEmail(email, pass);
      setUser(loggedUser);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Gagal masuk ke akun.";
      setError(message);
      throw err;
    }
  }, []);

  const logout = React.useCallback(async () => {
    try {
      await signOutUser();
      setUser(null);
    } catch (err: unknown) {
      console.warn("Logout error:", err);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
