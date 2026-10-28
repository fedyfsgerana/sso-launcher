"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Paged, SortDirection, TableQuery } from "@/lib/api/paged";

export type SortState = Readonly<{
  key: string;
  direction: SortDirection;
}> | null;

type Options<T> = Readonly<{
  fetchPage: (query: TableQuery) => Promise<Paged<T>>;
  filters: Readonly<Record<string, string>>;
  initialPageSize?: number;
}>;

export function useServerTable<T>({
  fetchPage,
  filters,
  initialPageSize = 10,
}: Options<T>) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [search, setSearchState] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSortState] = useState<SortState>(null);
  const [data, setData] = useState<Paged<T>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: initialPageSize,
  });
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const fetchRef = useRef(fetchPage);
  const filterKey = JSON.stringify(filters);

  useEffect(() => {
    fetchRef.current = fetchPage;
  }, [fetchPage]);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedSearch(search.trim()),
      300,
    );

    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let active = true;

    void fetchRef
      .current({
        page,
        pageSize,
        search: debouncedSearch || undefined,
        sort: sort?.key,
        direction: sort?.direction,
        ...(JSON.parse(filterKey) as Record<string, string>),
      })
      .then((result) => {
        if (active) {
          setData(result);
        }
      })
      .catch(() => {
        if (active) {
          setData({ items: [], total: 0, page: 1, pageSize });
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [page, pageSize, debouncedSearch, sort, filterKey, version]);

  const reload = useCallback(() => setVersion((value) => value + 1), []);

  return {
    items: data.items,
    total: data.total,
    page: data.page,
    pageSize,
    offset: (data.page - 1) * pageSize,
    loading,
    search,
    sort,
    reload,
    setPage,
    setPageSize: (size: number) => {
      setPageSizeState(size);
      setPage(1);
    },
    setSearch: (value: string) => {
      setSearchState(value);
      setPage(1);
    },
    toggleSort: (key: string) => {
      setSortState((current) =>
        current?.key !== key
          ? { key, direction: "asc" }
          : current.direction === "asc"
            ? { key, direction: "desc" }
            : null,
      );
      setPage(1);
    },
    resetPage: () => setPage(1),
  };
}
