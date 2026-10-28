"use client";

import { useEffect } from "react";
import { ErrorView } from "@/components/portal/error-view";
import "./globals.css";

type GlobalErrorProps = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="id">
      <body>
        <title>SSO Launcher — Terjadi Kesalahan</title>
        <ErrorView
          standalone
          code="500"
          label="Terjadi Kesalahan"
          title="SSO Launcher gagal dimuat"
          description="Terjadi kesalahan yang tidak terduga saat memuat portal. Coba muat ulang. Kalau masalahnya berulang, hubungi Administrator Sistem."
          kind="error"
          reference={error.digest}
          onRetry={reset}
        />
      </body>
    </html>
  );
}
