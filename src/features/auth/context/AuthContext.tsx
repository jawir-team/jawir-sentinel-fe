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
import { getCurrentUser } from "@/services/api/auth";
import { CurrentUser } from "@/types/user";

interface AuthContextType {
  user: SentinelAuthUser | null;
  currentUser: CurrentUser | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  refetchCurrentUser: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<SentinelAuthUser | null>(null);
  const [currentUser, setCurrentUser] = React.useState<CurrentUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchSentinelUser = React.useCallback(
    async (firebaseUser: SentinelAuthUser | null) => {
      if (!firebaseUser) {
        setCurrentUser(null);
        return;
      }
      try {
        const sentinelUser = await getCurrentUser(firebaseUser.email);
        setCurrentUser(sentinelUser);
      } catch (err: unknown) {
        console.error("Failed to load /me sentinel user:", err);
        // If 401 or 403, de-authorize session
        await signOutUser();
        setUser(null);
        setCurrentUser(null);
        setError("User session is invalid or account has been deactivated.");
      }
    },
    []
  );

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

    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchSentinelUser(firebaseUser);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchSentinelUser]);

  const login = React.useCallback(
    async (email: string, pass: string) => {
      setError(null);
      try {
        const loggedUser = await signInWithEmail(email, pass);
        setUser(loggedUser);
        await fetchSentinelUser(loggedUser);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to sign in.";
        setError(message);
        throw err;
      }
    },
    [fetchSentinelUser]
  );

  const logout = React.useCallback(async () => {
    try {
      await signOutUser();
      setUser(null);
      setCurrentUser(null);
    } catch (err: unknown) {
      console.warn("Logout error:", err);
    }
  }, []);

  const refetchCurrentUser = React.useCallback(async () => {
    if (user) {
      await fetchSentinelUser(user);
    }
  }, [user, fetchSentinelUser]);

  const isAdmin = currentUser?.system_role === "ADMIN";

  return (
    <AuthContext.Provider
      value={{
        user,
        currentUser,
        isAdmin,
        loading,
        error,
        login,
        logout,
        refetchCurrentUser,
      }}
    >
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
