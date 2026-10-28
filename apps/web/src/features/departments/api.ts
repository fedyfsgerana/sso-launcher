import { z } from "zod";
import { apiClient } from "@/lib/api/client";

const departmentSchema = z.object({
  name: z.string(),
  code: z.string(),
});

const departmentListSchema = z.object({
  items: z.array(departmentSchema),
});

export type DepartmentItem = z.infer<typeof departmentSchema>;
export type DepartmentList = z.infer<typeof departmentListSchema>;

export async function getDepartments(): Promise<DepartmentList> {
  const response = await apiClient<unknown>("/api/departments");

  return departmentListSchema.parse(response);
}
