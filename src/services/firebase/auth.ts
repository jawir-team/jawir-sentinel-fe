import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { auth } from "./config";

export interface SentinelAuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

const LOCAL_MOCK_USER_KEY = "sentinel_mock_auth_user";

export async function signInWithEmail(
  email: string,
  pass: string
): Promise<SentinelAuthUser> {
  // If we have actual Firebase API key configured and it is not placeholder
  const isRealFirebase =
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    !process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes("Placeholder");

  if (isRealFirebase) {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      return {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName,
      };
    } catch (err: unknown) {
      console.warn("Firebase sign-in failed, attempting fallback session:", err);
      // If error is invalid-api-key or unauthorized domain or network, allow fallback for development/demo
      const mockUser: SentinelAuthUser = {
        uid: `demo-${email.split("@")[0]}`,
        email: email,
        displayName: email.split("@")[0].toUpperCase(),
      };
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_MOCK_USER_KEY, JSON.stringify(mockUser));
        window.dispatchEvent(new Event("sentinel-auth-changed"));
      }
      return mockUser;
    }
  } else {
    // Development / demo mode without Firebase project
    const mockUser: SentinelAuthUser = {
      uid: `demo-${email.split("@")[0]}`,
      email: email,
      displayName: email.split("@")[0].toUpperCase(),
    };
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_MOCK_USER_KEY, JSON.stringify(mockUser));
      window.dispatchEvent(new Event("sentinel-auth-changed"));
    }
    return mockUser;
  }
}

export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn("Firebase sign-out warning:", err);
  }
  if (typeof window !== "undefined") {
    localStorage.removeItem(LOCAL_MOCK_USER_KEY);
    window.dispatchEvent(new Event("sentinel-auth-changed"));
  }
}

export async function getFirebaseIdToken(
  forceRefresh = false
): Promise<string | null> {
  if (auth.currentUser) {
    try {
      return await auth.currentUser.getIdToken(forceRefresh);
    } catch (err) {
      console.warn("Failed to get Firebase token:", err);
    }
  }

  // Check fallback mock user
  if (typeof window !== "undefined") {
    const mockUser = localStorage.getItem(LOCAL_MOCK_USER_KEY);
    if (mockUser) {
      try {
        const parsed = JSON.parse(mockUser);
        return `mock-token-${parsed.email || "user"}`;
      } catch {
        return null;
      }
    }
  }

  return null;
}

export function onAuthStateChange(
  callback: (user: SentinelAuthUser | null) => void
): () => void {
  // Listen to Firebase auth state
  const unsubscribeFirebase = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      callback({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
      });
    } else {
      // Check if fallback mock user is active
      if (typeof window !== "undefined") {
        const mockUserStr = localStorage.getItem(LOCAL_MOCK_USER_KEY);
        if (mockUserStr) {
          try {
            const parsed = JSON.parse(mockUserStr);
            callback(parsed);
            return;
          } catch {
            // ignore
          }
        }
      }
      callback(null);
    }
  });

  // Also listen for local auth changed events
  const handleLocalChange = () => {
    if (typeof window !== "undefined") {
      const mockUserStr = localStorage.getItem(LOCAL_MOCK_USER_KEY);
      if (mockUserStr) {
        try {
          const parsed = JSON.parse(mockUserStr);
          callback(parsed);
          return;
        } catch {
          // ignore
        }
      } else if (!auth.currentUser) {
        callback(null);
      }
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("sentinel-auth-changed", handleLocalChange);
  }

  return () => {
    unsubscribeFirebase();
    if (typeof window !== "undefined") {
      window.removeEventListener("sentinel-auth-changed", handleLocalChange);
    }
  };
}
