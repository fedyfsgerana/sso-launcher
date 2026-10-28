import { z } from "zod";
import { idSchema } from "@/lib/schemas/id";
import { apiClient, withReason } from "@/lib/api/client";

const credentialSchema = z.object({
  id: idSchema,
  applicationId: idSchema,
  applicationName: z.string(),
  clientId: z.string(),
  scope: z.string(),
  isActive: z.boolean(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
  lastUsedAt: z.iso.datetime({ offset: true }).nullable().default(null),
  guideDownloadedAt: z.iso.datetime({ offset: true }).nullable().default(null),
});

const createdCredentialSchema = z.object({
  id: idSchema,
  clientId: z.string(),
  clientSecret: z.string(),
  scope: z.string(),
});

export type ServiceCredential = z.infer<typeof credentialSchema>;
export type CreatedCredential = z.infer<typeof createdCredentialSchema>;

export async function getCredentials(
  applicationId: string,
): Promise<ServiceCredential[]> {
  const response = await apiClient<unknown>(
    `/api/admin/service-credentials?applicationId=${applicationId}`,
  );

  return z.array(credentialSchema).parse(response);
}

export async function createCredential(
  applicationId: string,
): Promise<CreatedCredential> {
  const response = await apiClient<unknown>("/api/admin/service-credentials", {
    method: "POST",
    body: JSON.stringify({ applicationId, scope: "sso.validate users.read" }),
  });

  return createdCredentialSchema.parse(response);
}

export async function revokeCredential(
  credentialId: string,
  reason: string,
): Promise<void> {
  await apiClient<void>(
    withReason(`/api/admin/service-credentials/${credentialId}`, reason),
    {
      method: "DELETE",
    },
  );
}

export async function deleteCredential(
  credentialId: string,
  reason: string,
): Promise<void> {
  await apiClient<void>(
    withReason(`/api/admin/service-credentials/${credentialId}/record`, reason),
    {
      method: "DELETE",
    },
  );
}

const templateSchema = z.object({
  fileName: z.string(),
  content: z.string(),
});

export const CLIENT_ID_PLACEHOLDER = "{{PORTAL_CLIENT_ID}}";
export const CLIENT_SECRET_PLACEHOLDER = "{{PORTAL_CLIENT_SECRET}}";

export type IntegrationTemplate = z.infer<typeof templateSchema>;

export async function claimIntegrationGuide(
  credentialId: string,
): Promise<IntegrationTemplate> {
  return templateSchema.parse(
    await apiClient<unknown>(
      `/api/admin/service-credentials/${credentialId}/integration-guide`,
      { method: "POST" },
    ),
  );
}

export function fillIntegrationTemplate(
  template: IntegrationTemplate,
  credential: { clientId: string; clientSecret: string },
): IntegrationTemplate {
  return {
    fileName: template.fileName,
    content: template.content
      .replaceAll(CLIENT_ID_PLACEHOLDER, credential.clientId)
      .replaceAll(CLIENT_SECRET_PLACEHOLDER, credential.clientSecret),
  };
}

export async function discardCredential(credentialId: string): Promise<void> {
  await apiClient<void>(
    `/api/admin/service-credentials/${credentialId}/discard`,
    { method: "POST" },
  );
}
