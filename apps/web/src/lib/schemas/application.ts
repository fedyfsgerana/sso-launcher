import { z } from "zod";

export const applicationSchema = z.object({
  name: z.string().trim().min(1, "Application name is required"),
  description: z.string().trim().min(1, "Description is required"),
  launchUrl: z.url("Enter a valid launch URL"),
  status: z.enum(["active", "inactive"]),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;
