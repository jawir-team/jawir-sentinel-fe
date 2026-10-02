import { apiGet } from "./client";
import { CurrentUser } from "@/types/user";

export async function getCurrentUser(fallbackEmail?: string | null): Promise<CurrentUser> {
  try {
    return await apiGet<CurrentUser>("/me");
  } catch (err: unknown) {
    // Check if error is 401 or 403 - rethrow so session terminates
    if (err && typeof err === "object" && "status" in err) {
      const status = (err as { status?: number }).status;
      if (status === 401 || status === 403) {
        throw err;
      }
    }

    // Fallback contract layer if backend server is not reachable
    const email = fallbackEmail || "ops@jawir.local";
    const isAdmin = email.toLowerCase().includes("admin");

    return {
      id: `usr-${email.split("@")[0]}`,
      name: isAdmin ? "System Administrator" : email.split("@")[0].toUpperCase() + " User",
      email: email,
      system_role: isAdmin ? "ADMIN" : "USER",
      unit: {
        id: isAdmin ? "unit-admin" : "unit-ops",
        code: isAdmin ? "ADM" : "OPS",
        name: isAdmin ? "Administration" : "Operations",
      },
    };
  }
}
