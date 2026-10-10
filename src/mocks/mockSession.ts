import { initialUsers } from "./mockData";
import { UserItem } from "@/types/user";

const MOCK_AUTH_USER_KEY = "sentinel_mock_auth_user";

export function getActiveMockUser(): UserItem {
  if (typeof window !== "undefined") {
    try {
      const stored = window.localStorage.getItem(MOCK_AUTH_USER_KEY);
      const email = stored ? JSON.parse(stored).email : null;
      const matched = initialUsers.find(
        (user) =>
          typeof email === "string" &&
          user.email.toLowerCase() === email.toLowerCase()
      );
      if (matched) return matched;
    } catch {
      // Fall through to the seeded Maker persona.
    }
  }

  return initialUsers[0];
}
