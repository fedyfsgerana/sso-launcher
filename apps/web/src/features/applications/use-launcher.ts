"use client";

import { useCallback, useRef, useState } from "react";
import type { LaunchTarget } from "@/components/portal/launch-overlay";
import { useToast } from "@/components/portal/toast";
import {
  isSsoNotReady,
  launchApplication,
} from "@/features/applications/launch";
import { usePortalData } from "@/features/portal/portal-data-provider";
import { ApiError } from "@/lib/api/client";
import { clearSignedOut } from "@/lib/portal/app-sign-out";
import type { PortalApplication } from "@/types/portal";

const MINIMUM_OVERLAY_MS = 2500;

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function openInNewTab(url: string) {
  let tab: Window | null = null;

  try {
    tab = window.open(url, "_blank");
  } catch {
    tab = null;
  }

  if (!tab || tab.closed) {
    window.location.assign(url);
    return;
  }

  try {
    tab.opener = null;
  } catch {
    return;
  }
}

export function useLauncher() {
  const { refresh } = usePortalData();
  const { showToast } = useToast();
  const [launching, setLaunching] = useState<LaunchTarget | null>(null);
  const busy = useRef(false);

  const open = useCallback(
    async (application: PortalApplication) => {
      if (application.status !== "active" || busy.current) {
        return;
      }

      busy.current = true;
      clearSignedOut(application.slug);

      try {
        const result = await launchApplication(application);

        setLaunching({ name: application.name, usesSso: application.usesSso });
        await wait(MINIMUM_OVERLAY_MS);

        openInNewTab(result.launchUrl);

        await refresh();
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          return;
        }

        if (isSsoNotReady(error)) {
          showToast(
            `${application.name} belum siap dibuka karena SSO belum terhubung ke SSO Launcher. Hubungi Administrator Sistem.`,
            "warning",
          );
          return;
        }

        showToast(
          `${application.name} gagal dibuka. Coba lagi beberapa saat lagi.`,
          "error",
        );
      } finally {
        busy.current = false;
        setLaunching(null);
      }
    },
    [refresh, showToast],
  );

  return { launching, open };
}
