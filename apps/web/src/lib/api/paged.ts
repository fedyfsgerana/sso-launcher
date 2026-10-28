import { z } from "zod";

export function pagedSchema<T extends z.ZodType>(item: T) {
  return z.object({
    items: z.array(item),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
  });
}

export type Paged<T> = Readonly<{
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}>;

export type SortDirection = "asc" | "desc";

export type TableQuery = Readonly<{
  page: number;
  pageSize: number;
  search?: string;
  sort?: string;
  direction?: SortDirection;
  [filter: string]: string | number | undefined;
}>;

export function toQueryString(query: TableQuery) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  }

  return params.toString();
}
