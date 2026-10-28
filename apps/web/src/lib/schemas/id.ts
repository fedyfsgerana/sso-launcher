import { z } from "zod";

export const idSchema = z
  .union([z.number().int().positive(), z.string().regex(/^[1-9]\d*$/)])
  .transform((value) => String(value));