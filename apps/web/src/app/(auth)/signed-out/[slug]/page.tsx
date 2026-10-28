"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { ReturnOverlay } from "@/components/portal/launch-overlay";
import { signOutOfApplication } from "@/features/applications/sign-out";
import { ApiError } from "@/lib/api/client";
import { markSignedOut } from "@/lib/portal/app-sign-out";
import { queueToast } from "@/lib/portal/pending-toast";
import { clearSessionActive } from "@/lib/portal/session-expiry";

const HOME_PATH = "/overview";
const LOGIN_PATH = "/login";
const MINIMUM_OVERLAY_MS = 2500;

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

export default function ApplicationSignedOutPage() {
  const { slug } = useParams<{ slug: string }>();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) {
      return;
    }

    started.current = true;
    markSignedOut(slug);

    const shown = wait(MINIMUM_OVERLAY_MS);

    signOutOfApplication(slug)
      .then(async (result) => {
        await shown;
        queueToast(
          `Anda telah keluar dari ${result.name}. Sesi SSO Launcher tetap aktif.`,
        );
        window.location.replace(HOME_PATH);
      })
      .catch(async (error: unknown) => {
        await shown;

        if (error instanceof ApiError && error.status === 401) {
          clearSessionActive();
          queueToast(
            "Anda telah keluar dari aplikasi. Silakan masuk kembali ke SSO Launcher.",
          );
          window.location.replace(LOGIN_PATH);
          return;
        }

        queueToast("Anda telah keluar dari aplikasi.");
        window.location.replace(HOME_PATH);
      });
  }, [slug]);

  return <ReturnOverlay />;
}
