import { apiClient } from "@/lib/api/client";
import { clearSessionActive } from "@/lib/portal/session-expiry";

export async function logout(): Promise<void> {
  clearSessionActive();

  await apiClient<void>("/api/auth/logout", {
    method: "POST",
  });
}
