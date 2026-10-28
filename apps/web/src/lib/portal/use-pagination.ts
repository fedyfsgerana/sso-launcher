"use client";

import { useState } from "react";

export function usePagination<T>(items: T[], initialSize = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setSize] = useState(initialSize);

  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(page, pages);
  const offset = (current - 1) * pageSize;

  return {
    page: current,
    pageSize,
    offset,
    rows: items.slice(offset, offset + pageSize),
    setPage,
    setPageSize: (size: number) => {
      setSize(size);
      setPage(1);
    },
    resetPage: () => setPage(1),
  };
}
