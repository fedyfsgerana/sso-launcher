import { z } from "zod";
import { idSchema } from "@/lib/schemas/id";

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

export const authSessionSchema = z.object({
  userId: idSchema,
  name: z.string().min(1),
  email: z.string(),
  department: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  departemenCode: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  jobTitle: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  expiresAt: z.iso.datetime({ offset: true }),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type AuthSession = z.infer<typeof authSessionSchema>;
