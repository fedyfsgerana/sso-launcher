"use client";

import { useEffect, useState } from "react";

export function useMinLoading(loading: boolean, minimum = 450): boolean {
  const [elapsed, setElapsed] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setElapsed(true), minimum);

    return () => window.clearTimeout(timer);
  }, [minimum]);

  return loading || !elapsed;
}
