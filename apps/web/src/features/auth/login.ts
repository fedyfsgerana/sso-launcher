import { z } from "zod";
import { ApiError, apiClient } from "@/lib/api/client";
import {
  authSessionSchema,
  loginSchema,
  type LoginInput,
} from "@/lib/schemas/auth";
import type { AuthSession } from "@/types/auth";

export async function login(input: LoginInput): Promise<AuthSession> {
  const data = loginSchema.parse(input);

  const response = await apiClient<unknown>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });

  return authSessionSchema.parse(response);
}

const lockedSchema = z.object({
  error: z.literal("login_locked"),
  retryAfterSeconds: z.number().int().positive(),
});

export function loginRetryMinutes(error: unknown): number | null {
  if (!(error instanceof ApiError) || error.status !== 429) {
    return null;
  }

  const locked = lockedSchema.safeParse(error.body);

  return locked.success
    ? Math.max(1, Math.ceil(locked.data.retryAfterSeconds / 60))
    : 1;
}
