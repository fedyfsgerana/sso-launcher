"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { startRouteProgress } from "@/lib/portal/route-progress-events";

export function useAppRouter() {
  const router = useRouter();

  return useMemo(
    () => ({
      ...router,
      push: (...args: Parameters<typeof router.push>) => {
        startRouteProgress(args[0]);
        router.push(...args);
      },
      replace: (...args: Parameters<typeof router.replace>) => {
        startRouteProgress(args[0]);
        router.replace(...args);
      },
    }),
    [router],
  );
}
