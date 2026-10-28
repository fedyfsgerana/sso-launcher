"use client";

import { useEffect, useRef, useState } from "react";
import { TILE_GAP, TILE_MAX_COLUMNS, TILE_MIN } from "./overview-config";

export function useTileColumns<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [columns, setColumns] = useState(TILE_MAX_COLUMNS);

  useEffect(() => {
    const node = ref.current;

    if (!node) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      const fit = Math.floor(
        (entry.contentRect.width + TILE_GAP) / (TILE_MIN + TILE_GAP),
      );

      setColumns(Math.min(TILE_MAX_COLUMNS, Math.max(1, fit)));
    });

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return { ref, columns };
}
