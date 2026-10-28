import { z } from "zod";
import { apiClient } from "@/lib/api/client";
import { idSchema } from "@/lib/schemas/id";

const signOutSchema = z.object({
  applicationId: idSchema,
  name: z.string(),
  slug: z.string(),
});

export type ApplicationSignOut = z.infer<typeof signOutSchema>;

export async function signOutOfApplication(
  slug: string,
): Promise<ApplicationSignOut> {
  const response = await apiClient<unknown>("/api/sso/sign-out", {
    method: "POST",
    body: JSON.stringify({ slug }),
  });

  return signOutSchema.parse(response);
}
