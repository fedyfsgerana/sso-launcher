"use client";

import { useMemo, useState } from "react";
import type { SortState } from "@/lib/portal/use-server-table";

type SortValue = string | number | null | undefined;

export function useClientSort<T>(
  items: T[],
  getters: Readonly<Record<string, (item: T) => SortValue>>,
) {
  const [sort, setSort] = useState<SortState>(null);

  const sorted = useMemo(() => {
    const getter = sort ? getters[sort.key] : undefined;

    if (!sort || !getter) {
      return items;
    }

    const factor = sort.direction === "asc" ? 1 : -1;

    return [...items].sort((left, right) => {
      const a = getter(left);
      const b = getter(right);

      if (a === b) {
        return 0;
      }

      if (a === null || a === undefined) {
        return 1;
      }

      if (b === null || b === undefined) {
        return -1;
      }

      if (typeof a === "number" && typeof b === "number") {
        return (a - b) * factor;
      }

      return (
        String(a).localeCompare(String(b), "id-ID", { sensitivity: "base" }) *
        factor
      );
    });
  }, [getters, items, sort]);

  function toggleSort(key: string) {
    setSort((current) =>
      current?.key !== key
        ? { key, direction: "asc" }
        : current.direction === "asc"
          ? { key, direction: "desc" }
          : null,
    );
  }

  return { sorted, sort, toggleSort };
}
