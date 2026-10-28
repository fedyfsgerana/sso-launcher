"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ROUTE_PROGRESS_EVENT } from "@/lib/portal/route-progress-events";

type ProgressState = {
  from: string;
  startedAt: number;
} | null;

function isInternalNavigation(anchor: HTMLAnchorElement, pathname: string) {
  if (anchor.target && anchor.target !== "_self") {
    return false;
  }

  if (anchor.hasAttribute("download")) {
    return false;
  }

  const href = anchor.getAttribute("href");

  if (!href || href.startsWith("#") || href.startsWith("mailto:")) {
    return false;
  }

  const url = new URL(anchor.href, window.location.href);

  if (url.origin !== window.location.origin) {
    return false;
  }

  return url.pathname !== pathname;
}

export function RouteProgress() {
  const pathname = usePathname();
  const [state, setState] = useState<ProgressState>(null);
  const pathnameRef = useRef(pathname);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const anchor = (event.target as HTMLElement).closest("a");

      if (!anchor || !isInternalNavigation(anchor, pathnameRef.current)) {
        return;
      }

      start();
    }

    function start() {
      setState({ from: pathnameRef.current, startedAt: Date.now() });

      if (timer.current) {
        window.clearTimeout(timer.current);
      }

      timer.current = window.setTimeout(() => setState(null), 10000);
    }

    function handleProgrammatic(event: Event) {
      const href = (event as CustomEvent<string>).detail;

      if (!href) {
        return;
      }

      const url = new URL(href, window.location.href);

      if (
        url.origin !== window.location.origin ||
        url.pathname === pathnameRef.current
      ) {
        return;
      }

      start();
    }

    document.addEventListener("click", handleClick, true);
    window.addEventListener(ROUTE_PROGRESS_EVENT, handleProgrammatic);

    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener(ROUTE_PROGRESS_EVENT, handleProgrammatic);

      if (timer.current) {
        window.clearTimeout(timer.current);
      }
    };
  }, []);

  const active = state !== null && state.from === pathname;

  return (
    <div
      className={active ? "route-progress on" : "route-progress"}
      role="progressbar"
      aria-hidden={!active}
      aria-label="Memuat halaman"
    >
      <i key={state?.startedAt ?? 0} />
    </div>
  );
}
