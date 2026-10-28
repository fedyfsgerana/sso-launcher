import { apiClient } from "@/lib/api/client";

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

export async function changePassword(
  input: ChangePasswordInput,
): Promise<void> {
  await apiClient<void>("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
