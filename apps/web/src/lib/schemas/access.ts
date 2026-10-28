import { z } from "zod";
import { idSchema } from "@/lib/schemas/id";

export const accessSchema = z.object({
  userId: idSchema,
  applicationId: idSchema,
  canLaunch: z.boolean(),
});

export const applicationAccessSchema = z.object({
  id: idSchema,
  userId: idSchema,
  userFullName: z.string(),
  email: z.string(),
  applicationId: idSchema,
  applicationName: z.string(),
  applicationSlug: z.string(),
  canLaunch: z.boolean(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});

export const applicationAccessesSchema = z.array(applicationAccessSchema);

export const upsertAccessResultSchema = z.object({
  id: idSchema,
});

export type AccessInput = z.infer<typeof accessSchema>;
