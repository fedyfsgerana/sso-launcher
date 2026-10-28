"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ErrorView } from "@/components/portal/error-view";
import { LaunchOverlay } from "@/components/portal/launch-overlay";
import {
  isSsoNotReady,
  launchApplication,
} from "@/features/applications/launch";
import { usePortalData } from "@/features/portal/portal-data-provider";
import { isSignedOut } from "@/lib/portal/app-sign-out";
import { queueToast } from "@/lib/portal/pending-toast";
import { useAppRouter } from "@/lib/portal/use-app-router";

function withReturnPath(
  launchUrl: string,
  returnPath: string | null,
  usesSso: boolean,
) {
  if (
    !usesSso ||
    !returnPath ||
    !returnPath.startsWith("/") ||
    returnPath.startsWith("//")
  ) {
    return launchUrl;
  }

  const url = new URL(launchUrl);
  url.searchParams.set("return_to", returnPath);

  return url.toString();
}

export default function OpenApplicationPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useAppRouter();
  const { applications, loading } = usePortalData();
  const [failed, setFailed] = useState(false);
  const [notReady, setNotReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const started = useRef<number | null>(null);

  const application = applications.find((item) => item.slug === slug) ?? null;

  useEffect(() => {
    if (loading || !application || application.status !== "active") {
      return;
    }

    if (started.current === attempt) {
      return;
    }

    started.current = attempt;

    if (isSignedOut(application.slug)) {
      queueToast(
        `Anda sudah keluar dari ${application.name}. Buka lagi lewat tombol Buka di SSO Launcher.`,
      );
      router.replace("/overview");
      return;
    }

    const returnPath = new URLSearchParams(window.location.search).get("to");

    launchApplication(application)
      .then((result) => {
        window.opener = null;
        window.location.replace(
          withReturnPath(result.launchUrl, returnPath, result.usesSso),
        );
      })
      .catch((error: unknown) => {
        if (isSsoNotReady(error)) {
          setNotReady(true);
          return;
        }

        setFailed(true);
      });
  }, [application, attempt, loading, router]);

  if (loading) {
    return <LaunchOverlay launch={{ name: "aplikasi", usesSso: true }} />;
  }

  if (!application) {
    return (
      <ErrorView
        standalone
        kind="forbidden"
        code="403"
        label="Aplikasi tidak dapat dibuka"
        title="Anda belum punya akses ke aplikasi ini"
        description="Aplikasi yang Anda tuju tidak ada atau belum diberikan ke grup Anda. Hubungi Administrator Sistem kalau Anda membutuhkannya untuk pekerjaan."
      />
    );
  }

  if (application.status !== "active") {
    return (
      <ErrorView
        standalone
        kind="maintenance"
        code="503"
        label="Sedang maintenance"
        title={`${application.name} sedang maintenance`}
        description="Aplikasi ini sementara belum bisa dibuka. Silakan coba lagi nanti, atau hubungi Administrator Sistem untuk informasi lebih lanjut."
      />
    );
  }

  if (notReady) {
    return (
      <ErrorView
        standalone
        kind="not-ready"
        code="503"
        label="Belum siap dipakai"
        title={`${application.name} belum siap dibuka`}
        description="SSO aplikasi ini belum terhubung ke SSO Launcher, jadi Anda belum bisa masuk. Hubungi Administrator Sistem untuk informasi lebih lanjut."
      />
    );
  }

  if (failed) {
    return (
      <ErrorView
        standalone
        kind="error"
        code="500"
        label="Gagal membuka aplikasi"
        title={`${application.name} gagal dibuka`}
        description="Portal tidak berhasil menyiapkan akses ke aplikasi ini. Coba lagi. Kalau masalahnya berulang, hubungi Administrator Sistem."
        onRetry={() => {
          setFailed(false);
          setAttempt((value) => value + 1);
        }}
      />
    );
  }

  return (
    <LaunchOverlay
      launch={{ name: application.name, usesSso: application.usesSso }}
    />
  );
}
