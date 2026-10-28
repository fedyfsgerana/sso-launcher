import { apiClient } from "@/lib/api/client";
import { authSessionSchema } from "@/lib/schemas/auth";
import type { AuthSession } from "@/types/auth";

export async function getSession(): Promise<AuthSession> {
  const response = await apiClient<unknown>("/api/auth/session");

  return authSessionSchema.parse(response);
}
